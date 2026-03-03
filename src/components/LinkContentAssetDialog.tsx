import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Search, Plus, FileText, Zap, Link } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ContentAssetForm from "./ContentAssetForm";

interface LinkContentAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grantId: string;
  onSuccess: () => void;
  onQuickInsert?: (content: string) => void;
}

const LinkContentAssetDialog = ({ open, onOpenChange, grantId, onSuccess, onQuickInsert }: LinkContentAssetDialogProps) => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [createAssetOpen, setCreateAssetOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAvailableAssets();
    }
  }, [open, grantId]);

  const fetchAvailableAssets = async () => {
    setLoading(true);

    // Fetch assets not already linked to this grant
    const { data: linkedAssets } = await supabase
      .from("grant_content_links")
      .select("content_asset_id")
      .eq("grant_opportunity_id", grantId);

    const linkedIds = linkedAssets?.map((la) => la.content_asset_id) || [];

    const query = supabase
      .from("content_repository_assets")
      .select("*")
      .order("created_at", { ascending: false });

    if (linkedIds.length > 0) {
      query.not("id", "in", `(${linkedIds.join(",")})`);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to load content assets");
    } else {
      setAssets(data || []);
    }
    setLoading(false);
  };

  const handleLinkAsset = async (assetId: string) => {
    const { error } = await supabase.from("grant_content_links").insert({
      grant_opportunity_id: grantId,
      content_asset_id: assetId,
    });

    if (error) {
      toast.error("Failed to link content asset");
    } else {
      toast.success("Content asset linked successfully");
      onSuccess();
      fetchAvailableAssets();
    }
  };

  const handleQuickInsert = (asset: any) => {
    if (onQuickInsert && asset.description) {
      onQuickInsert(asset.description);
      toast.success(`"${asset.title}" content inserted`);
      onOpenChange(false);
    } else if (!asset.description) {
      toast.error("This asset has no content to insert");
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || asset.asset_type === filterType;
    
    const matchesTag =
      filterTag === "all" ||
      (asset.content_tags && asset.content_tags.includes(filterTag));

    return matchesSearch && matchesType && matchesTag;
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Content Repository
                </DialogTitle>
                {onQuickInsert && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Search and insert content, or link assets to this grant
                  </p>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => setCreateAssetOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                New Asset
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="letter">Letter</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="environment">Environment</SelectItem>
                  <SelectItem value="social_services">Social Services</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No available content assets</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setCreateAssetOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create First Asset
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <p className="font-medium text-sm truncate">{asset.title}</p>
                        <Badge variant="outline" className="text-xs capitalize flex-shrink-0">
                          {asset.asset_type.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      {asset.description && (
                        <p className="text-xs text-muted-foreground line-clamp-3 pl-6">
                          {asset.description}
                        </p>
                      )}
                      {asset.content_tags && asset.content_tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap pl-6">
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
                    </div>
                    <div className="flex flex-col gap-2 ml-3 flex-shrink-0">
                      {onQuickInsert && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleQuickInsert(asset)}
                          className="whitespace-nowrap bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                          title="Insert content into Project Description"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Quick Insert
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLinkAsset(asset.id)}
                        className="whitespace-nowrap"
                      >
                        <Link className="w-3 h-3 mr-1" />
                        Link
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ContentAssetForm
        open={createAssetOpen}
        onOpenChange={setCreateAssetOpen}
        onSuccess={() => {
          fetchAvailableAssets();
          setCreateAssetOpen(false);
        }}
      />
    </>
  );
};

export default LinkContentAssetDialog;
