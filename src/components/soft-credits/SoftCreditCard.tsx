import { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  CREDIT_TYPE_LABELS,
  CREDIT_TYPE_COLORS,
  useDeleteSoftCredit,
  type SoftCredit,
} from '@/hooks/useSoftCredits';
import { formatDistanceToNow } from 'date-fns';

interface SoftCreditCardProps {
  softCredit: SoftCredit;
  showConstituentLink?: boolean;
  showGiftLink?: boolean;
  onConstituentClick?: (constituentId: string) => void;
}

export function SoftCreditCard({
  softCredit,
  showConstituentLink = true,
  showGiftLink = false,
  onConstituentClick,
}: SoftCreditCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const deleteMutation = useDeleteSoftCredit();

  const handleDelete = () => {
    deleteMutation.mutate({
      softCreditId: softCredit.id,
      giftId: softCredit.gift_id,
      constituentId: softCredit.constituent_id,
    });
    setShowDeleteDialog(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const hasLongNotes = softCredit.notes && softCredit.notes.length > 100;

  return (
    <>
      <div className="group flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Constituent Name */}
          <div className="flex-1 min-w-0">
            {showConstituentLink && softCredit.constituent ? (
              <button
                onClick={() => onConstituentClick?.(softCredit.constituent_id)}
                className="font-medium text-left hover:text-primary hover:underline truncate block"
              >
                {softCredit.constituent.full_legal_name}
              </button>
            ) : (
              <span className="font-medium truncate block">
                {softCredit.constituent?.full_legal_name || 'Unknown'}
              </span>
            )}

            {/* Notes */}
            {softCredit.notes && (
              <div className="mt-1">
                <p
                  className={cn(
                    'text-xs text-muted-foreground',
                    !expanded && hasLongNotes && 'line-clamp-1'
                  )}
                >
                  {softCredit.notes}
                </p>
                {hasLongNotes && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-primary flex items-center gap-1 mt-0.5"
                  >
                    {expanded ? (
                      <>
                        <ChevronUp className="h-3 w-3" /> Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" /> More
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Gift info if showing */}
            {showGiftLink && softCredit.gift && (
              <p className="text-xs text-muted-foreground mt-1">
                Gift: {formatCurrency(Number(softCredit.gift.amount))} on{' '}
                {new Date(softCredit.gift.date_received).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Credit Type Badge */}
          <Badge
            variant="secondary"
            className={cn('shrink-0', CREDIT_TYPE_COLORS[softCredit.credit_type])}
          >
            {CREDIT_TYPE_LABELS[softCredit.credit_type] || softCredit.credit_type}
          </Badge>

          {/* Amount */}
          <div className="text-right shrink-0">
            <p className="font-semibold">{formatCurrency(Number(softCredit.amount))}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(softCredit.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Soft Credit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this soft credit? This action cannot be
              undone. The constituent's soft credit totals will be updated automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Helper function
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
