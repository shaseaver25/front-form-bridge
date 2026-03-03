import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BoardDocument {
  id: string;
  board_id: string;
  name: string;
  description: string | null;
  document_type: 'link' | 'file';
  url: string | null;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export function useBoardDocuments(boardId: string) {
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: ['board-documents', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('board_documents')
        .select('*')
        .eq('board_id', boardId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BoardDocument[];
    },
    enabled: !!boardId,
  });

  const addLinkMutation = useMutation({
    mutationFn: async ({ name, url, description }: { name: string; url: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('board_documents')
        .insert({
          board_id: boardId,
          name,
          url,
          description: description || null,
          document_type: 'link',
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-documents', boardId] });
      toast.success('Link added');
    },
    onError: (error) => {
      toast.error('Failed to add link: ' + error.message);
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, name, description }: { file: File; name: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const filePath = `${boardId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('board-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('board-documents')
        .getPublicUrl(filePath);

      // Save document metadata
      const { data, error } = await supabase
        .from('board_documents')
        .insert({
          board_id: boardId,
          name,
          description: description || null,
          document_type: 'file',
          file_path: filePath,
          url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-documents', boardId] });
      toast.success('File uploaded');
    },
    onError: (error) => {
      toast.error('Failed to upload file: ' + error.message);
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (document: BoardDocument) => {
      // If it's a file, delete from storage first
      if (document.document_type === 'file' && document.file_path) {
        const { error: storageError } = await supabase.storage
          .from('board-documents')
          .remove([document.file_path]);
        
        if (storageError) {
          console.warn('Failed to delete file from storage:', storageError);
        }
      }

      // Delete metadata
      const { error } = await supabase
        .from('board_documents')
        .delete()
        .eq('id', document.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-documents', boardId] });
      toast.success('Document deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete document: ' + error.message);
    },
  });

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    addLink: addLinkMutation.mutate,
    uploadFile: uploadFileMutation.mutate,
    deleteDocument: deleteDocumentMutation.mutate,
    isAddingLink: addLinkMutation.isPending,
    isUploadingFile: uploadFileMutation.isPending,
  };
}
