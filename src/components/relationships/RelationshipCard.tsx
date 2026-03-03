import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { 
  Heart, Users, Baby, Briefcase, Building2, Shield, Building, 
  Handshake, Smile, Copy, Pencil, Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDeleteRelationship } from "@/hooks/useRelationships";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  users: Users,
  baby: Baby,
  briefcase: Briefcase,
  'building-2': Building2,
  shield: Shield,
  building: Building,
  handshake: Handshake,
  smile: Smile,
  copy: Copy,
};

interface RelationshipCardProps {
  relationship: {
    id: string;
    from_constituent_id: string;
    to_constituent_id: string;
    start_date: string | null;
    end_date: string | null;
    is_primary: boolean;
    notes: string | null;
    to_constituent: {
      id: string;
      full_legal_name: string;
      primary_email: string | null;
    } | null;
    relationship_type: {
      id: string;
      name: string;
      category: string;
      icon: string | null;
    } | null;
  };
}

export function RelationshipCard({ relationship }: RelationshipCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const deleteRelationship = useDeleteRelationship();
  
  const IconComponent = ICON_MAP[relationship.relationship_type?.icon || 'users'] || Users;
  const isActive = !relationship.end_date;
  
  const formatDateRange = () => {
    if (relationship.start_date && relationship.end_date) {
      return `${format(new Date(relationship.start_date), 'MMM yyyy')} - ${format(new Date(relationship.end_date), 'MMM yyyy')}`;
    }
    if (relationship.start_date) {
      return `Since ${format(new Date(relationship.start_date), 'MMM yyyy')}`;
    }
    return null;
  };

  const handleDelete = () => {
    deleteRelationship.mutate({
      relationshipId: relationship.id,
      fromId: relationship.from_constituent_id,
      toId: relationship.to_constituent_id
    });
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary/30 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-muted">
          <IconComponent className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link 
              to={`/?constituent=${relationship.to_constituent?.id}`}
              className="font-medium hover:underline text-foreground"
            >
              {relationship.to_constituent?.full_legal_name || 'Unknown'}
            </Link>
            {relationship.is_primary && (
              <Badge variant="secondary" className="text-xs">Primary</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{relationship.relationship_type?.name}</span>
            {formatDateRange() && (
              <>
                <span>•</span>
                <span>{formatDateRange()}</span>
              </>
            )}
          </div>
          
          {relationship.notes && (
            <button 
              onClick={() => setShowNotes(!showNotes)}
              className="text-xs text-primary hover:underline"
            >
              {showNotes ? 'Hide notes' : 'Show notes'}
            </button>
          )}
          
          {showNotes && relationship.notes && (
            <p className="text-sm text-muted-foreground bg-muted p-2 rounded mt-1">
              {relationship.notes}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? 'Active' : 'Ended'}
        </Badge>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Relationship</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove this relationship? This will also remove the reciprocal relationship.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
