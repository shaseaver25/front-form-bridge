import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, HelpCircle, TrendingUp, FileText, Rocket, Users, Mic, Kanban, DollarSign, Settings } from 'lucide-react';
import { HelpSidebar } from '@/components/help/HelpSidebar';
import { HelpArticleView } from '@/components/help/HelpArticleView';
import { HelpSearchResults } from '@/components/help/HelpSearchResults';
import { HelpFAQSection } from '@/components/help/HelpFAQSection';
import { useMostViewedArticles, HELP_CATEGORIES } from '@/hooks/useHelpArticles';

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

interface HelpPageProps {
  articleSlug?: string;
}

export default function HelpPage({ articleSlug }: HelpPageProps) {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: popularArticles } = useMostViewedArticles();
  
  const showSearch = searchQuery.length >= 2;

  // If viewing specific article
  if (articleSlug) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Sidebar */}
          <div className="w-64 border-r bg-muted/30 hidden lg:block">
            <HelpSidebar currentSlug={articleSlug} />
          </div>

          {/* Article Content */}
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-3xl mx-auto">
              <HelpArticleView slug={articleSlug} />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Main help center
  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-64 border-r bg-muted/30 hidden lg:block">
          <HelpSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold">Help & Training Center</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Find guides, tutorials, and answers to help you get the most out of TailoredU
              </p>
            </div>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search for articles, guides, and FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>

            {/* Search Results or Main Content */}
            {showSearch ? (
              <HelpSearchResults query={searchQuery} />
            ) : (
              <>
                {/* Category Grid */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Browse by Category</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {HELP_CATEGORIES.map((category) => {
                      const Icon = ICON_MAP[category.icon] || FileText;
                      return (
                        <Link
                          key={category.value}
                          to={`/help?category=${category.value}`}
                          className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent hover:border-primary/50 transition-colors text-center"
                        >
                          <div className="p-3 rounded-lg bg-primary/10">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <span className="font-medium text-sm">{category.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Popular Articles */}
                {popularArticles && popularArticles.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Popular Articles
                    </h2>
                    <div className="grid gap-3">
                      {popularArticles.map((article) => (
                        <Link
                          key={article.id}
                          to={`/help/${article.slug}`}
                          className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors"
                        >
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <div className="flex-1">
                            <span className="font-medium">{article.title}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {HELP_CATEGORIES.find((c) => c.value === article.category)?.label}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tabs for Articles and FAQs */}
                <Tabs defaultValue="faqs" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="faqs" className="gap-2">
                      <HelpCircle className="w-4 h-4" />
                      FAQs
                    </TabsTrigger>
                    <TabsTrigger value="getting-started" className="gap-2">
                      <Rocket className="w-4 h-4" />
                      Getting Started
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="faqs">
                    <HelpFAQSection limit={10} />
                  </TabsContent>

                  <TabsContent value="getting-started">
                    <Card>
                      <CardHeader>
                        <CardTitle>Welcome to TailoredU</CardTitle>
                        <CardDescription>
                          Get started with these essential guides
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                          New to TailoredU? Start here to learn the basics and get up to speed quickly.
                        </p>
                        <div className="grid gap-3">
                          {[
                            { title: 'Dashboard Overview', slug: 'dashboard-overview' },
                            { title: 'Understanding Constituents', slug: 'understanding-constituents' },
                            { title: 'Your First Grant', slug: 'first-grant' },
                          ].map((item) => (
                            <Link
                              key={item.slug}
                              to={`/help/${item.slug}`}
                              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                            >
                              <FileText className="w-5 h-5 text-muted-foreground" />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
