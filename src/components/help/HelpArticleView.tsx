import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import { FileText, Download, ExternalLink, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useHelpArticle, useHelpArticles, HELP_CATEGORIES, HelpArticle } from '@/hooks/useHelpArticles';

interface HelpArticleViewProps {
  slug: string;
}

export function HelpArticleView({ slug }: HelpArticleViewProps) {
  const { data: article, isLoading, error } = useHelpArticle(slug);
  const { data: allArticles } = useHelpArticles();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
        <div className="space-y-2 mt-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Article not found</h3>
          <p className="text-sm text-muted-foreground">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild className="mt-4">
            <Link to="/help">Back to Help Center</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const categoryLabel = HELP_CATEGORIES.find((c) => c.value === article.category)?.label || article.category;

  // Get related articles from same category
  const relatedArticles = allArticles
    ?.filter((a) => a.category === article.category && a.id !== article.id)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/help" className="hover:text-foreground transition-colors">
          Help
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link 
          to={`/help?category=${article.category}`}
          className="hover:text-foreground transition-colors"
        >
          {categoryLabel}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">{article.title}</span>
      </nav>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{article.title}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="secondary">{categoryLabel}</Badge>
          {article.subcategory && (
            <Badge variant="outline">{article.subcategory}</Badge>
          )}
          <span>
            Updated {format(new Date(article.updated_at), 'MMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        {article.document_type === 'markdown' && article.content && (
          <div dangerouslySetInnerHTML={{ __html: formatMarkdown(article.content) }} />
        )}

        {(article.document_type === 'pdf' || article.document_type === 'docx') && article.document_url && (
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium">{article.title}</p>
                  <p className="text-sm text-muted-foreground uppercase">
                    {article.document_type} Document
                  </p>
                </div>
              </div>
              <Button asChild>
                <a href={article.document_url} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {article.document_type === 'video' && article.document_url && (
          <div className="aspect-video">
            <iframe
              src={article.document_url}
              className="w-full h-full rounded-lg"
              allowFullScreen
            />
          </div>
        )}
      </div>

      {/* Feedback */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <p className="text-sm font-medium">Was this article helpful?</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <ThumbsUp className="w-4 h-4 mr-2" />
              Yes
            </Button>
            <Button variant="outline" size="sm">
              <ThumbsDown className="w-4 h-4 mr-2" />
              No
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Related Articles */}
      {relatedArticles && relatedArticles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Related Articles</h3>
          <div className="grid gap-3">
            {relatedArticles.map((related) => (
              <Link
                key={related.id}
                to={`/help/${related.slug}`}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">{related.title}</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple markdown formatter with XSS protection
function formatMarkdown(content: string): string {
  const html = content
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n/gim, '<br />');

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'br', 'ul', 'ol', 'li', 'a', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
}
