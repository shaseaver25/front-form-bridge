import { useState } from 'react';
import { Search, Sparkles, FileText, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useSearchDocuments } from '@/hooks/useSearchDocuments';
import { isFeatureEnabled } from '@/config/features';

interface SearchMode {
  mode: 'keyword' | 'semantic';
  label: string;
  icon: React.ReactNode;
  available: boolean;
}

interface DocumentSearchProps {
  grantId?: string;
  onSelectDocument?: (documentId: string) => void;
  className?: string;
}

export const DocumentSearch = ({ grantId, onSelectDocument, className }: DocumentSearchProps) => {
  const [query, setQuery] = useState('');
  const [activeMode, setActiveMode] = useState<'keyword' | 'semantic'>('keyword');
  
  const SEMANTIC_SEARCH_ENABLED = isFeatureEnabled('SEMANTIC_SEARCH');
  
  const searchModes: SearchMode[] = [
    {
      mode: 'keyword',
      label: 'Keyword',
      icon: <Search className="h-4 w-4" />,
      available: true
    },
    {
      mode: 'semantic',
      label: 'AI Search',
      icon: <Sparkles className="h-4 w-4" />,
      available: SEMANTIC_SEARCH_ENABLED
    }
  ];
  
  const { data: results, isLoading } = useSearchDocuments({
    query,
    grantId,
    searchMode: activeMode,
    enabled: query.length > 2
  });
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Search mode toggle */}
      <div className="flex gap-2">
        {searchModes.map(mode => (
          <Button
            key={mode.mode}
            variant={activeMode === mode.mode ? "default" : "outline"}
            size="sm"
            onClick={() => mode.available && setActiveMode(mode.mode)}
            disabled={!mode.available}
            className={cn(
              "flex items-center gap-2",
              !mode.available && "opacity-50 cursor-not-allowed"
            )}
          >
            {mode.icon}
            {mode.label}
            {!mode.available && (
              <Badge variant="secondary" className="ml-1 text-xs">
                Phase 2
              </Badge>
            )}
          </Button>
        ))}
      </div>
      
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            activeMode === 'keyword' 
              ? "Search by filename or content..." 
              : "Describe what you're looking for..."
          }
          className="pl-10"
        />
      </div>
      
      {/* Results */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {!isLoading && query.length > 2 && results && results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No documents found matching "{query}"</p>
        </div>
      )}
      
      {!isLoading && results && results.length > 0 && (
        <div className="space-y-2">
          {results.map((result) => (
            <Card 
              key={result.document_id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onSelectDocument?.(result.document_id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.file_name}</p>
                    {result.category_name && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {result.category_name}
                      </Badge>
                    )}
                    {result.excerpt && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {result.excerpt}
                      </p>
                    )}
                  </div>
                  {result.relevance_score > 0 && (
                    <Badge variant="secondary" className="shrink-0">
                      {Math.round(result.relevance_score * 100)}%
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
