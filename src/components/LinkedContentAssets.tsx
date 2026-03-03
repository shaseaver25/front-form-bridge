import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Loader2, ExternalLink, Zap } from "lucide-react";
import LinkContentAssetDialog from "./LinkContentAssetDialog";

interface LinkedContentAssetsProps {
  grantId: string;
  onQuickInsert?: (content: string) => void;
}

const LinkedContentAssets = ({ grantId, onQuickInsert }: LinkedContentAssetsProps) => {
  const [linkedAssets, setLinkedAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  useEffect(() => {
    fetchLinkedAssets();
  }, [grantId]);

  const fetchLinkedAssets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("grant_content_links")
      .select(`
        id,
        content_repository_assets (
          id,
          title,
          asset_type,
          content_tags,
          description,
          file_url
        )
      `)
      .eq("grant_opportunity_id", grantId);

    if (error) {
      toast.error("Failed to load linked content assets");
    } else {
      setLinkedAssets(data || []);
    }
    setLoading(false);
  };

  const handleUnlink = async (linkId: string) => {
    const { error } = await supabase
      .from("grant_content_links")
      .delete()
      .eq("id", linkId);

    if (error) {
      toast.error("Failed to unlink content asset");
    } else {
      toast.success("Content asset unlinked successfully");
      fetchLinkedAssets();
    }
  };

  const handleQuickInsert = (asset: any) => {
    if (onQuickInsert && asset.description) {
      onQuickInsert(asset.description);
      toast.success(`"${asset.title}" content inserted`);
    } else if (!asset.description) {
      toast.error("This asset has no content to insert");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Linked Content Assets
            </CardTitle>
            <Button size="sm" onClick={() => setLinkDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Link Asset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {linkedAssets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No content assets linked yet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setLinkDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Link First Asset
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {linkedAssets.map((link) => {
                const asset = link.content_repository_assets;
                return (
                  <div
                    key={link.id}
                    className="flex items-start justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{asset.title}</p>
                        <Badge variant="outline" className="text-xs capitalize flex-shrink-0">
                          {asset.asset_type.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      {asset.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {asset.description}
                        </p>
                      )}
                      {asset.content_tags && asset.content_tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {asset.content_tags.slice(0, 3).map((tag: string) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs capitalize"
                            >
                              {tag.replace(/_/g, " ")}
                            </Badge>
                          ))}
                          {asset.content_tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{asset.content_tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      {asset.file_url && (
                        <a
                          href={asset.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View File
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      {onQuickInsert && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleQuickInsert(asset)}
                          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                          title="Insert content into Project Description"
                        >
                          <Zap className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnlink(link.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <LinkContentAssetDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        grantId={grantId}
        onSuccess={fetchLinkedAssets}
      />
    </>
  );
};

export default LinkedContentAssets;
