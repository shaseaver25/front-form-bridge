import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GrantDocument {
  id: string;
  grant_id: string;
  category_id: string | null;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  extracted_text: string | null;
  text_extraction_status: string | null;
  text_extraction_error: string | null;
  word_count: number | null;
  document_metadata: unknown;
  uploaded_by: string | null;
  uploaded_at: string;
  version_number: number | null;
  replaces_document_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category?: DocumentCategory | null;
}

export interface DocumentCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

// Fetch all document categories
export const useDocumentCategories = () => {
  return useQuery({
    queryKey: ['document-categories'],
    queryFn: async (): Promise<DocumentCategory[]> => {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });
};

// Fetch documents for a specific grant
export const useGrantDocuments = (grantId: string | undefined) => {
  return useQuery({
    queryKey: ['grant-documents', grantId],
    queryFn: async (): Promise<GrantDocument[]> => {
      if (!grantId) return [];
      
      const { data, error } = await supabase
        .from('grant_documents')
        .select(`
          *,
          category:document_categories(*)
        `)
        .eq('grant_id', grantId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!grantId
  });
};

// Upload a new document
export const useUploadGrantDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      file,
      grantId,
      categoryId,
      notes,
      replacesDocumentId
    }: {
      file: File;
      grantId: string;
      categoryId?: string;
      notes?: string;
      replacesDocumentId?: string;
    }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Upload file to storage
      const fileName = `${grantId}/${Date.now()}_${file.name}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('grant-documents')
        .upload(fileName, file);
      
      if (storageError) throw storageError;
      
      // 2. Get version number if replacing
      let versionNumber = 1;
      if (replacesDocumentId) {
        const { data: prevDoc } = await supabase
          .from('grant_documents')
          .select('version_number')
          .eq('id', replacesDocumentId)
          .single();
        
        if (prevDoc) {
          versionNumber = (prevDoc.version_number || 1) + 1;
        }
      }
      
      // 3. Create database record
      const { data, error } = await supabase
        .from('grant_documents')
        .insert({
          grant_id: grantId,
          category_id: categoryId || null,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: storageData.path,
          notes: notes || null,
          uploaded_by: user?.id || null,
          text_extraction_status: 'pending',
          version_number: versionNumber,
          replaces_document_id: replacesDocumentId || null
        })
        .select(`
          *,
          category:document_categories(*)
        `)
        .single();
      
      if (error) throw error;
      
      // RAG-READY: Phase 2 will trigger text extraction here
      // await supabase.functions.invoke('extract-document-text', { body: { documentId: data.id } });
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['grant-documents', variables.grantId] });
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    }
  });
};

// Delete a document
export const useDeleteGrantDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ documentId, storagePath, grantId }: { documentId: string; storagePath: string; grantId: string }) => {
      // 1. Delete from storage
      const { error: storageError } = await supabase.storage
        .from('grant-documents')
        .remove([storagePath]);
      
      if (storageError) {
        console.warn('Storage delete warning:', storageError);
      }
      
      // 2. Delete database record (cascades to chunks)
      const { error } = await supabase
        .from('grant_documents')
        .delete()
        .eq('id', documentId);
      
      if (error) throw error;
      
      return { documentId, grantId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['grant-documents', data.grantId] });
      toast.success('Document deleted');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  });
};

// Get download URL for a document
export const useDocumentDownloadUrl = (storagePath: string | undefined) => {
  return useQuery({
    queryKey: ['document-url', storagePath],
    queryFn: async () => {
      if (!storagePath) return null;
      
      const { data, error } = await supabase.storage
        .from('grant-documents')
        .createSignedUrl(storagePath, 3600); // 1 hour expiry
      
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!storagePath,
    staleTime: 1000 * 60 * 30 // 30 minutes
  });
};
