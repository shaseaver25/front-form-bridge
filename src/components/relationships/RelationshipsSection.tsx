import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useConstituentRelationships, CATEGORY_LABELS, CATEGORY_ORDER } from "@/hooks/useRelationships";
import { RelationshipCard } from "./RelationshipCard";
import { AddRelationshipDialog } from "./AddRelationshipDialog";

interface RelationshipsSectionProps {
  constituentId: string;
  constituentName: string;
}

export function RelationshipsSection({ constituentId, constituentName }: RelationshipsSectionProps) {
  const { data, isLoading } = useConstituentRelationships(constituentId);
  
  const totalCount = data?.all.length || 0;
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-36" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Relationships
            {totalCount > 0 && (
              <Badge variant="secondary">{totalCount}</Badge>
            )}
          </CardTitle>
          <AddRelationshipDialog 
            constituentId={constituentId}
            constituentName={constituentName}
          />
        </div>
      </CardHeader>
      <CardContent>
        {totalCount === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No relationships recorded.</p>
            <p className="text-sm">Add connections to other constituents.</p>
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={CATEGORY_ORDER} className="space-y-2">
            {CATEGORY_ORDER.map(category => {
              const relationships = data?.grouped[category];
              if (!relationships || relationships.length === 0) return null;
              
              return (
                <AccordionItem key={category} value={category} className="border rounded-lg px-3">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{CATEGORY_LABELS[category]}</span>
                      <Badge variant="outline" className="text-xs">
                        {relationships.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {relationships.map(rel => (
                        <RelationshipCard key={rel.id} relationship={rel} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
