import { Link } from 'react-router-dom';
import { HelpCircle, Mail } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useHelpFaqs, HELP_CATEGORIES } from '@/hooks/useHelpArticles';

interface HelpFAQSectionProps {
  category?: string;
  limit?: number;
}

export function HelpFAQSection({ category, limit }: HelpFAQSectionProps) {
  const { data: faqs, isLoading } = useHelpFaqs(category);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }

  const displayFaqs = limit ? faqs?.slice(0, limit) : faqs;

  if (!displayFaqs || displayFaqs.length === 0) {
    return null;
  }

  // Group by category if no category filter
  const faqsByCategory = !category
    ? displayFaqs.reduce((acc, faq) => {
        if (!acc[faq.category]) {
          acc[faq.category] = [];
        }
        acc[faq.category].push(faq);
        return acc;
      }, {} as Record<string, typeof displayFaqs>)
    : { [category]: displayFaqs };

  return (
    <div className="space-y-8">
      {Object.entries(faqsByCategory).map(([cat, categoryFaqs]) => {
        const categoryLabel = HELP_CATEGORIES.find((c) => c.value === cat)?.label || cat;

        return (
          <div key={cat} className="space-y-4">
            {!category && (
              <h3 className="text-lg font-semibold">{categoryLabel}</h3>
            )}
            <Accordion type="single" collapsible className="space-y-2">
              {categoryFaqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                      <span>{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-8 text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        );
      })}

      {/* Contact Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Still have questions?</CardTitle>
          <CardDescription>
            Can't find what you're looking for? We're here to help.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <a href="mailto:support@example.com">
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
