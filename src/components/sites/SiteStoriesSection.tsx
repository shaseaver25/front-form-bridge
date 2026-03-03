import { useState } from "react";
import { Plus, Quote, User, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useSiteStories } from "@/hooks/useSiteStories";
import { format } from "date-fns";
import type { SiteStory } from "@/types/sites";

interface SiteStoriesSectionProps {
  siteId: string;
}

export function SiteStoriesSection({ siteId }: SiteStoriesSectionProps) {
  const { stories, isLoading, createStory, updateStory, deleteStory } = useSiteStories(siteId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<SiteStory | null>(null);

  const [title, setTitle] = useState("");
  const [storyContent, setStoryContent] = useState("");
  const [personName, setPersonName] = useState("");
  const [personRole, setPersonRole] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [tags, setTags] = useState("");

  const resetForm = () => {
    setTitle("");
    setStoryContent("");
    setPersonName("");
    setPersonRole("");
    setIsPublished(false);
    setTags("");
    setEditingStory(null);
  };

  const openEditDialog = (story: SiteStory) => {
    setEditingStory(story);
    setTitle(story.title);
    setStoryContent(story.story_content);
    setPersonName(story.person_name ?? "");
    setPersonRole(story.person_role ?? "");
    setIsPublished(story.is_published);
    setTags(story.tags?.join(", ") ?? "");
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!title || !storyContent) return;

    const data = {
      title,
      story_content: storyContent,
      person_name: personName || undefined,
      person_role: personRole || undefined,
      is_published: isPublished,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
    };

    if (editingStory) {
      await updateStory.mutateAsync({ id: editingStory.id, ...data });
    } else {
      await createStory.mutateAsync({ site_id: siteId, ...data });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const togglePublish = async (story: SiteStory) => {
    await updateStory.mutateAsync({
      id: story.id,
      is_published: !story.is_published,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>User Stories</CardTitle>
          <CardDescription>Testimonials and stories from beneficiaries</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Story
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingStory ? "Edit Story" : "Add New Story"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  placeholder="e.g., A Journey of Growth"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Story *</Label>
                <Textarea
                  placeholder="Tell the story..."
                  rows={6}
                  value={storyContent}
                  onChange={(e) => setStoryContent(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Person's Name</Label>
                  <Input
                    placeholder="e.g., Maria S."
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Person's Role</Label>
                  <Input
                    placeholder="e.g., Student, Parent, Volunteer"
                    value={personRole}
                    onChange={(e) => setPersonRole(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  placeholder="e.g., success, education, youth"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Published</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this story visible publicly
                  </p>
                </div>
                <Switch
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!title || !storyContent || createStory.isPending || updateStory.isPending}
                >
                  {createStory.isPending || updateStory.isPending ? "Saving..." : editingStory ? "Update" : "Add Story"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {stories.length === 0 ? (
          <EmptyState
            type="no-data"
            entityName="Story"
            onAction={() => setIsDialogOpen(true)}
            actionLabel="Add Story"
          />
        ) : (
          <div className="space-y-4">
            {stories.map((story) => (
              <Card key={story.id} className="relative group">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => togglePublish(story)}
                    title={story.is_published ? "Unpublish" : "Publish"}
                  >
                    {story.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(story)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Story</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this story?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteStory.mutate(story.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Quote className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">{story.title}</CardTitle>
                    </div>
                    <Badge variant={story.is_published ? "default" : "secondary"}>
                      {story.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  {story.person_name && (
                    <CardDescription className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {story.person_name}
                      {story.person_role && ` - ${story.person_role}`}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {story.story_content}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex flex-wrap gap-1">
                      {story.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(story.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
