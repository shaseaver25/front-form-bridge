import { useState, useEffect } from "react";
import { Plus, Search, X, FileText, Sparkles, Settings, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useContentRepository, ContentItem } from "@/hooks/useContentRepository";
import { generateAllEmbeddings, EmbeddingGenerationResult } from "@/lib/api/embeddings";
import { toast } from "sonner";
import { ContentCard } from "@/components/content-repository/ContentCard";
import { ContentTypeFilter } from "@/components/content-repository/ContentTypeFilter";
import { AddContentDialog } from "@/components/content-repository/AddContentDialog";
import { ContentDetailDialog } from "@/components/content-repository/ContentDetailDialog";
import { supabase } from "@/integrations/supabase/client";
import { FEATURE_FLAGS } from "@/config/features";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ContentRepository() {
  const [searchInput, setSearchInput] = useState("");
  const [contentType, setContentType] = useState("all");
  const [onlyTemplates, setOnlyTemplates] = useState(false);
  const [semanticSearch, setSemanticSearch] = useState<boolean>(FEATURE_FLAGS.SEMANTIC_SEARCH);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewItem, setViewItem] = useState<ContentItem | null>(null);
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [embeddingProgress, setEmbeddingProgress] = useState<string>("");

  const debouncedSearch = useDebounce(searchInput, 300);

  const { data: content, isLoading, error } = useContentRepository({
    searchQuery: debouncedSearch || undefined,
    contentType: contentType === "all" ? undefined : contentType,
    onlyTemplates,
    searchMode: semanticSearch ? 'semantic' : 'keyword',
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id);
    });
  }, []);

  const handleClearFilters = () => {
    setSearchInput("");
    setContentType("all");
    setOnlyTemplates(false);
  };

  const hasActiveFilters = searchInput || contentType !== "all" || onlyTemplates;

  const handleEdit = (item: ContentItem) => {
    setEditItem(item);
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = (open: boolean) => {
    setAddDialogOpen(open);
    if (!open) {
      setEditItem(null);
    }
  };

  const handleGenerateAllEmbeddings = async () => {
    if (!FEATURE_FLAGS.SEMANTIC_SEARCH) {
      toast.error("Semantic search is not enabled");
      return;
    }

    setIsGeneratingEmbeddings(true);
    setEmbeddingProgress("Starting...");

    try {
      const result = await generateAllEmbeddings(
        'content_repository',
        10,
        (progress: EmbeddingGenerationResult) => {
          if (progress.remaining > 0) {
            setEmbeddingProgress(`Processing... ${progress.processed} done, ${progress.remaining} remaining`);
          } else {
            setEmbeddingProgress(`Completed ${progress.processed} items`);
          }
        }
      );

      if (result.totalProcessed > 0) {
        toast.success(`Generated embeddings for ${result.totalProcessed} items`);
      } else {
        toast.info("All content already has embeddings");
      }

      if (result.errors.length > 0) {
        console.error("Embedding errors:", result.errors);
        toast.error(`${result.errors.length} items failed to process`);
      }
    } catch (error) {
      console.error("Failed to generate embeddings:", error);
      toast.error("Failed to generate embeddings");
    } finally {
      setIsGeneratingEmbeddings(false);
      setEmbeddingProgress("");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Content Repository</h1>
            <p className="text-muted-foreground mt-1">
              Reusable content for grant proposals
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setAddDialogOpen(true)} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Content
            </Button>

            {FEATURE_FLAGS.SEMANTIC_SEARCH && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleGenerateAllEmbeddings}
                    disabled={isGeneratingEmbeddings}
                    className="cursor-pointer"
                  >
                    {isGeneratingEmbeddings ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {embeddingProgress || "Processing..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                        Generate All Embeddings
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by title, content, or tags..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4">
            <ContentTypeFilter value={contentType} onChange={setContentType} />
            
            <div className="flex items-center space-x-2">
              <Switch
                id="templates-only"
                checked={onlyTemplates}
                onCheckedChange={setOnlyTemplates}
              />
              <Label htmlFor="templates-only" className="cursor-pointer">
                Templates Only
              </Label>
            </div>

            {/* Semantic Search Toggle */}
            {FEATURE_FLAGS.SEMANTIC_SEARCH && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2 border-l pl-4">
                      <Switch
                        id="semantic-search"
                        checked={semanticSearch}
                        onCheckedChange={setSemanticSearch}
                      />
                      <Label htmlFor="semantic-search" className="cursor-pointer flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Semantic Search
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Semantic search understands meaning, not just exact words</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2 mt-4">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <X className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Error loading content</h3>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
          </div>
        ) : content && content.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                onView={setViewItem}
                onEdit={handleEdit}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No content found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              {hasActiveFilters
                ? "Try different filters or add new content."
                : "Get started by adding your first reusable content."}
            </p>
            {!hasActiveFilters && (
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Content
              </Button>
            )}
          </div>
        )}

        {/* Results count */}
        {content && content.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Showing {content.length} result{content.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <AddContentDialog
        open={addDialogOpen}
        onOpenChange={handleCloseAddDialog}
        editItem={editItem}
      />

      {/* View Detail Dialog */}
      <ContentDetailDialog
        item={viewItem}
        open={!!viewItem}
        onOpenChange={(open) => !open && setViewItem(null)}
        onEdit={handleEdit}
        currentUserId={currentUserId}
      />
    </Layout>
  );
}
