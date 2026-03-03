import { Link } from 'react-router-dom';
import { FileText, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchHelpArticles, HELP_CATEGORIES, HelpArticle } from '@/hooks/useHelpArticles';

interface HelpSearchResultsProps {
  query: string;
}

export function HelpSearchResults({ query }: HelpSearchResultsProps) {
  const { data: results, isLoading } = useSearchHelpArticles(query);

  if (query.length < 2) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border rounded-lg">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No results found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          We couldn't find any articles matching "{query}". Try different keywords or browse by category.
        </p>
      </div>
    );
  }

  // Group results by category
  const resultsByCategory = results.reduce((acc, article) => {
    if (!acc[article.category]) {
      acc[article.category] = [];
    }
    acc[article.category].push(article);
    return acc;
  }, {} as Record<string, HelpArticle[]>);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
      </p>

      {Object.entries(resultsByCategory).map(([category, articles]) => {
        const categoryLabel = HELP_CATEGORIES.find((c) => c.value === category)?.label || category;

        return (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {categoryLabel}
            </h3>
            <div className="space-y-2">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  to={`/help/${article.slug}`}
                  className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium mb-1">
                        {highlightMatch(article.title, query)}
                      </h4>
                      {article.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {getSnippet(article.content, query)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {article.document_type}
                        </Badge>
                        {article.subcategory && (
                          <Badge variant="outline" className="text-xs">
                            {article.subcategory}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function highlightMatch(text: string, query: string): React.ReactNode {
  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function getSnippet(content: string, query: string): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerContent.indexOf(lowerQuery);

  if (index === -1) {
    return content.slice(0, 150) + '...';
  }

  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, index + query.length + 100);

  let snippet = content.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}
