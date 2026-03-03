import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SiteMedia, MediaType } from '@/types/sites';

interface UploadMediaInput {
  site_id: string;
  file: File;
  media_type: MediaType;
  title?: string;
  caption?: string;
  tags?: string[];
  is_featured?: boolean;
  taken_at?: string;
}

export function useSiteMedia(siteId: string | undefined) {
  const queryClient = useQueryClient();

  const mediaQuery = useQuery({
    queryKey: ['site-media', siteId],
    queryFn: async () => {
      if (!siteId) return [];
      
      const { data, error } = await supabase
        .from('site_media')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SiteMedia[];
    },
    enabled: !!siteId,
  });

  const uploadMedia = useMutation({
    mutationFn: async ({ file, site_id, media_type, ...metadata }: UploadMediaInput) => {
      const { data: user } = await supabase.auth.getUser();
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${site_id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('site-media')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('site-media')
        .getPublicUrl(fileName);
      
      // Create database record
      const { data, error } = await supabase
        .from('site_media')
        .insert({
          site_id,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
          media_type,
          ...metadata,
          created_by: user.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as SiteMedia;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-media', siteId] });
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      toast.success('Media uploaded successfully');
    },
    onError: (error) => {
      toast.error('Failed to upload media: ' + error.message);
    },
  });

  const updateMedia = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SiteMedia> & { id: string }) => {
      const { data, error } = await supabase
        .from('site_media')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as SiteMedia;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-media', siteId] });
      toast.success('Media updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update media: ' + error.message);
    },
  });

  const deleteMedia = useMutation({
    mutationFn: async (media: SiteMedia) => {
      // Extract file path from URL
      const urlParts = media.file_url.split('/site-media/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('site-media').remove([filePath]);
      }
      
      const { error } = await supabase
        .from('site_media')
        .delete()
        .eq('id', media.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-media', siteId] });
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      toast.success('Media deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete media: ' + error.message);
    },
  });

  const setFeatured = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      // If setting as featured, unfeatured all others first
      if (is_featured && siteId) {
        await supabase
          .from('site_media')
          .update({ is_featured: false })
          .eq('site_id', siteId);
      }
      
      const { data, error } = await supabase
        .from('site_media')
        .update({ is_featured })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as SiteMedia;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-media', siteId] });
      toast.success('Featured image updated');
    },
    onError: (error) => {
      toast.error('Failed to update featured: ' + error.message);
    },
  });

  return {
    media: mediaQuery.data ?? [],
    isLoading: mediaQuery.isLoading,
    error: mediaQuery.error,
    uploadMedia,
    updateMedia,
    deleteMedia,
    setFeatured,
  };
}
