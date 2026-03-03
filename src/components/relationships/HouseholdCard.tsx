import { Link } from "react-router-dom";
import { Home, Users, DollarSign, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHousehold, useHouseholdGiftsSummary } from "@/hooks/useRelationships";

interface HouseholdCardProps {
  householdId: string;
  currentConstituentId: string;
}

export function HouseholdCard({ householdId, currentConstituentId }: HouseholdCardProps) {
  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId);
  const { data: giftsSummary, isLoading: loadingGifts } = useHouseholdGiftsSummary(householdId);
  
  if (loadingHousehold) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (!household) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Home className="h-5 w-5 text-primary" />
          {household.household_name}
          <Badge variant="secondary" className="text-xs capitalize">
            {household.household_type}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Household Members */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Household Members
          </h4>
          <div className="space-y-1">
            {household.members?.map(member => (
              <div key={member.id} className="flex items-center gap-2 text-sm">
                {member.id === currentConstituentId ? (
                  <span className="font-medium">{member.full_legal_name} (You)</span>
                ) : (
                  <Link 
                    to={`/?constituent=${member.id}`}
                    className="text-primary hover:underline"
                  >
                    {member.full_legal_name}
                  </Link>
                )}
                {member.id === household.primary_contact_constituent_id && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Crown className="h-3 w-3 text-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Primary Contact
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Combined Giving Summary */}
        {!loadingGifts && giftsSummary && (
          <div className="pt-3 border-t">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Combined Household Giving
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Gifts</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(giftsSummary.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Gift Count</p>
                <p className="text-lg font-semibold">{giftsSummary.giftCount}</p>
              </div>
            </div>
          </div>
        )}
        
        {household.greeting_format && (
          <div className="pt-3 border-t text-sm">
            <span className="text-muted-foreground">Greeting: </span>
            <span className="italic">"{household.greeting_format}"</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
