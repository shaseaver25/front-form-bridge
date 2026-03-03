import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Plus, Upload, Image, Video, Star, Trash2, Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useSiteMedia } from "@/hooks/useSiteMedia";
import { format } from "date-fns";
import type { SiteMedia, MediaType } from "@/types/sites";

interface SiteMediaGalleryProps {
  siteId: string;
}

export function SiteMediaGallery({ siteId }: SiteMediaGalleryProps) {
  const { media, isLoading, uploadMedia, updateMedia, deleteMedia, setFeatured } = useSiteMedia(siteId);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<SiteMedia | null>(null);
  const [editingMedia, setEditingMedia] = useState<SiteMedia | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [takenAt, setTakenAt] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.webm'],
    },
    maxFiles: 10,
  });

  const resetForm = () => {
    setFiles([]);
    setTitle("");
    setCaption("");
    setTags("");
    setTakenAt("");
    setEditingMedia(null);
  };

  const getMediaType = (file: File): MediaType => {
    return file.type.startsWith('video/') ? 'video' : 'photo';
  };

  const handleUpload = async () => {
    for (const file of files) {
      await uploadMedia.mutateAsync({
        site_id: siteId,
        file,
        media_type: getMediaType(file),
        title: title || undefined,
        caption: caption || undefined,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        taken_at: takenAt || undefined,
      });
    }
    setIsUploadDialogOpen(false);
    resetForm();
  };

  const handleUpdateMedia = async () => {
    if (!editingMedia) return;
    await updateMedia.mutateAsync({
      id: editingMedia.id,
      title: title || null,
      caption: caption || null,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
      taken_at: takenAt || null,
    });
    setEditingMedia(null);
    resetForm();
  };

  const openEditDialog = (mediaItem: SiteMedia) => {
    setEditingMedia(mediaItem);
    setTitle(mediaItem.title ?? "");
    setCaption(mediaItem.caption ?? "");
    setTags(mediaItem.tags?.join(", ") ?? "");
    setTakenAt(mediaItem.taken_at ?? "");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Media Gallery</CardTitle>
            <CardDescription>Photos and videos from this site</CardDescription>
          </div>
          <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
            setIsUploadDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Upload Media
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Media</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  {isDragActive ? (
                    <p>Drop the files here...</p>
                  ) : (
                    <div>
                      <p className="font-medium">Drop files here or click to browse</p>
                      <p className="text-sm text-muted-foreground">
                        Supports images and videos (up to 10 files)
                      </p>
                    </div>
                  )}
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Files</Label>
                    <div className="flex flex-wrap gap-2">
                      {files.map((file, i) => (
                        <Badge key={i} variant="secondary" className="flex items-center gap-1">
                          {file.type.startsWith('video/') ? <Video className="h-3 w-3" /> : <Image className="h-3 w-3" />}
                          {file.name}
                          <button
                            onClick={() => setFiles(files.filter((_, j) => j !== i))}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Title (optional)</Label>
                  <Input
                    placeholder="e.g., Community Event 2024"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Caption (optional)</Label>
                  <Textarea
                    placeholder="Describe the media..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      placeholder="e.g., event, students"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date Taken</Label>
                    <Input
                      type="date"
                      value={takenAt}
                      onChange={(e) => setTakenAt(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setIsUploadDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpload} 
                    disabled={files.length === 0 || uploadMedia.isPending}
                  >
                    {uploadMedia.isPending ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {media.length === 0 ? (
            <EmptyState
              type="no-data"
              entityName="Media"
              onAction={() => setIsUploadDialogOpen(true)}
              actionLabel="Upload Media"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                  onClick={() => setSelectedMedia(item)}
                >
                  {item.media_type === 'video' ? (
                    <video
                      src={item.file_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.file_url}
                      alt={item.title ?? "Site media"}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-between">
                      <Badge variant={item.media_type === 'video' ? "secondary" : "default"}>
                        {item.media_type === 'video' ? <Video className="h-3 w-3" /> : <Image className="h-3 w-3" />}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFeatured.mutate({ id: item.id, is_featured: !item.is_featured });
                          }}
                        >
                          <Star className={`h-4 w-4 ${item.is_featured ? "fill-yellow-400 text-yellow-400" : ""}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(item);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white hover:bg-white/20"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Media</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this media?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMedia.mutate(item)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <div>
                      {item.title && <p className="text-white font-medium text-sm truncate">{item.title}</p>}
                      {item.taken_at && (
                        <p className="text-white/70 text-xs">
                          {format(new Date(item.taken_at), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.is_featured && (
                    <div className="absolute top-2 left-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Media Dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl">
          {selectedMedia && (
            <div className="space-y-4">
              {selectedMedia.media_type === 'video' ? (
                <video
                  src={selectedMedia.file_url}
                  controls
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : (
                <img
                  src={selectedMedia.file_url}
                  alt={selectedMedia.title ?? "Site media"}
                  className="w-full max-h-[70vh] object-contain"
                />
              )}
              <div>
                {selectedMedia.title && <h3 className="font-semibold text-lg">{selectedMedia.title}</h3>}
                {selectedMedia.caption && <p className="text-muted-foreground">{selectedMedia.caption}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedMedia.tags?.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Media Dialog */}
      <Dialog open={!!editingMedia} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Caption</Label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Date Taken</Label>
                <Input
                  type="date"
                  value={takenAt}
                  onChange={(e) => setTakenAt(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => resetForm()}>
                Cancel
              </Button>
              <Button onClick={handleUpdateMedia} disabled={updateMedia.isPending}>
                {updateMedia.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
