import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  HelpCircle,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  BarChart3,
} from 'lucide-react';
import { HelpArticleEditor } from '@/components/help/HelpArticleEditor';
import {
  useHelpArticlesAdmin,
  useHelpFaqsAdmin,
  useCreateHelpArticle,
  useUpdateHelpArticle,
  useDeleteHelpArticle,
  useCreateHelpFaq,
  useUpdateHelpFaq,
  useDeleteHelpFaq,
  useHelpAnalytics,
} from '@/hooks/useHelpAdmin';
import { HELP_CATEGORIES, HelpArticle, HelpFaq } from '@/hooks/useHelpArticles';

export default function AdminHelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showArticleEditor, setShowArticleEditor] = useState(false);
  const [showFaqEditor, setShowFaqEditor] = useState(false);
  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null);
  const [editingFaq, setEditingFaq] = useState<HelpFaq | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<HelpArticle | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<HelpFaq | null>(null);

  // FAQ editor state
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('');

  const { data: articles, isLoading: articlesLoading } = useHelpArticlesAdmin();
  const { data: faqs, isLoading: faqsLoading } = useHelpFaqsAdmin();
  const { data: analytics } = useHelpAnalytics();

  const createArticle = useCreateHelpArticle();
  const updateArticle = useUpdateHelpArticle();
  const deleteArticle = useDeleteHelpArticle();
  const createFaq = useCreateHelpFaq();
  const updateFaq = useUpdateHelpFaq();
  const deleteFaq = useDeleteHelpFaq();

  const filteredArticles = articles?.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFaqs = faqs?.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveArticle = async (data: Parameters<typeof createArticle.mutateAsync>[0]) => {
    if (editingArticle) {
      await updateArticle.mutateAsync({ id: editingArticle.id, updates: data });
    } else {
      await createArticle.mutateAsync(data);
    }
    setShowArticleEditor(false);
    setEditingArticle(null);
  };

  const handleSaveFaq = async () => {
    if (editingFaq) {
      await updateFaq.mutateAsync({
        id: editingFaq.id,
        updates: { question: faqQuestion, answer: faqAnswer, category: faqCategory },
      });
    } else {
      await createFaq.mutateAsync({ question: faqQuestion, answer: faqAnswer, category: faqCategory });
    }
    setShowFaqEditor(false);
    setEditingFaq(null);
    setFaqQuestion('');
    setFaqAnswer('');
    setFaqCategory('');
  };

  const openFaqEditor = (faq?: HelpFaq) => {
    if (faq) {
      setEditingFaq(faq);
      setFaqQuestion(faq.question);
      setFaqAnswer(faq.answer);
      setFaqCategory(faq.category);
    } else {
      setEditingFaq(null);
      setFaqQuestion('');
      setFaqAnswer('');
      setFaqCategory('');
    }
    setShowFaqEditor(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Help Management</h1>
            <p className="text-muted-foreground">
              Manage help articles and FAQs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => openFaqEditor()}>
              <HelpCircle className="w-4 h-4 mr-2" />
              Add FAQ
            </Button>
            <Button onClick={() => setShowArticleEditor(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Article
            </Button>
          </div>
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalViews}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Articles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{articles?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  FAQs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{faqs?.length || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search articles and FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="articles">
          <TabsList>
            <TabsTrigger value="articles" className="gap-2">
              <FileText className="w-4 h-4" />
              Articles ({articles?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="faqs" className="gap-2">
              <HelpCircle className="w-4 h-4" />
              FAQs ({faqs?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Articles Tab */}
          <TabsContent value="articles" className="mt-6">
            {articlesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : filteredArticles && filteredArticles.length > 0 ? (
              <div className="space-y-3">
                {filteredArticles.map((article) => (
                  <Card key={article.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${article.is_published ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <div>
                          <h3 className="font-medium">{article.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {HELP_CATEGORIES.find((c) => c.value === article.category)?.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {article.document_type}
                            </Badge>
                            {!article.is_published && (
                              <Badge variant="secondary" className="text-xs">Draft</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingArticle(article);
                              setShowArticleEditor(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateArticle.mutate({
                              id: article.id,
                              updates: { is_published: !article.is_published },
                            })}
                          >
                            {article.is_published ? (
                              <>
                                <EyeOff className="w-4 h-4 mr-2" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-2" />
                                Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setArticleToDelete(article)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No articles yet</h3>
                  <p className="text-muted-foreground text-center max-w-sm mb-4">
                    Create your first help article to get started.
                  </p>
                  <Button onClick={() => setShowArticleEditor(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Article
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* FAQs Tab */}
          <TabsContent value="faqs" className="mt-6">
            {faqsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : filteredFaqs && filteredFaqs.length > 0 ? (
              <div className="space-y-3">
                {filteredFaqs.map((faq) => (
                  <Card key={faq.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <h3 className="font-medium">{faq.question}</h3>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {HELP_CATEGORIES.find((c) => c.value === faq.category)?.label}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openFaqEditor(faq)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setFaqToDelete(faq)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <HelpCircle className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No FAQs yet</h3>
                  <p className="text-muted-foreground text-center max-w-sm mb-4">
                    Add frequently asked questions to help your users.
                  </p>
                  <Button onClick={() => openFaqEditor()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add FAQ
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            {analytics && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Most Viewed Articles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.articleViews?.slice(0, 10).map((article) => (
                        <div key={article.id} className="flex items-center justify-between">
                          <span className="text-sm truncate max-w-[200px]">{article.title}</span>
                          <Badge variant="secondary">{article.views} views</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Views by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analytics.categoryViews || {}).map(([category, views]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm">
                            {HELP_CATEGORIES.find((c) => c.value === category)?.label || category}
                          </span>
                          <Badge variant="secondary">{views} views</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Article Editor Dialog */}
      <Dialog open={showArticleEditor} onOpenChange={setShowArticleEditor}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? 'Edit Article' : 'New Article'}
            </DialogTitle>
            <DialogDescription>
              Create or edit help documentation
            </DialogDescription>
          </DialogHeader>
          <HelpArticleEditor
            article={editingArticle || undefined}
            onSave={handleSaveArticle}
            isLoading={createArticle.isPending || updateArticle.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* FAQ Editor Dialog */}
      <Dialog open={showFaqEditor} onOpenChange={setShowFaqEditor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFaq ? 'Edit FAQ' : 'New FAQ'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Question</label>
              <Input
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                placeholder="Enter the question"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Answer</label>
              <textarea
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                placeholder="Enter the answer"
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                value={faqCategory}
                onChange={(e) => setFaqCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {HELP_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowFaqEditor(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveFaq}
                disabled={!faqQuestion || !faqAnswer || !faqCategory}
              >
                Save FAQ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Article Confirmation */}
      <AlertDialog open={!!articleToDelete} onOpenChange={(open) => !open && setArticleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{articleToDelete?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this article.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (articleToDelete) deleteArticle.mutate(articleToDelete.id);
                setArticleToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete FAQ Confirmation */}
      <AlertDialog open={!!faqToDelete} onOpenChange={(open) => !open && setFaqToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this FAQ?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this FAQ item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (faqToDelete) deleteFaq.mutate(faqToDelete.id);
                setFaqToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
