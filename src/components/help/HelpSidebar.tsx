import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, FileText, Rocket, Users, TrendingUp, Mic, Kanban, DollarSign, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HELP_CATEGORIES, useHelpArticles, HelpArticle } from '@/hooks/useHelpArticles';

const ICON_MAP: Record<string, React.ElementType> = {
  Rocket,
  Users,
  TrendingUp,
  FileText,
  Mic,
  Kanban,
  DollarSign,
  Settings,
};

interface HelpSidebarProps {
  currentSlug?: string;
}

export function HelpSidebar({ currentSlug }: HelpSidebarProps) {
  const location = useLocation();
  const [openCategories, setOpenCategories] = useState<string[]>(
    HELP_CATEGORIES.map((c) => c.value)
  );
  const { data: articles } = useHelpArticles();

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const articlesByCategory = articles?.reduce((acc, article) => {
    if (!acc[article.category]) {
      acc[article.category] = [];
    }
    acc[article.category].push(article);
    return acc;
  }, {} as Record<string, HelpArticle[]>) || {};

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        {HELP_CATEGORIES.map((category) => {
          const Icon = ICON_MAP[category.icon] || FileText;
          const categoryArticles = articlesByCategory[category.value] || [];
          const isOpen = openCategories.includes(category.value);

          return (
            <Collapsible
              key={category.value}
              open={isOpen}
              onOpenChange={() => toggleCategory(category.value)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span>{category.label}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-1 ml-6 space-y-1">
                {categoryArticles.length > 0 ? (
                  categoryArticles.map((article) => (
                    <Link
                      key={article.id}
                      to={`/help/${article.slug}`}
                      className={cn(
                        'block px-3 py-1.5 text-sm rounded-md transition-colors',
                        currentSlug === article.slug
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      {article.title}
                    </Link>
                  ))
                ) : (
                  <p className="px-3 py-1.5 text-xs text-muted-foreground italic">
                    No articles yet
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </ScrollArea>
  );
}
