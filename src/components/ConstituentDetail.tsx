import { useState } from "react";
import { Database } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Mail,
  MapPin,
  MessageSquare,
  User,
} from "lucide-react";
import GiftForm from "./GiftForm";
import LinkGrantDialog from "./LinkGrantDialog";
import ActivityTimeline from "./ActivityTimeline";
import ActivityNoteForm from "./ActivityNoteForm";
import MajorGiftForm from "./MajorGiftForm";
import EmailComposer from "./EmailComposer";
import { LMSStudentSection } from "./LMSStudentSection";
import { SoftCreditSummaryCard, SoftCreditsSection } from "./soft-credits";
import { RelationshipsSection, HouseholdCard, CreateHouseholdDialog } from "./relationships";
import { ConstituentEmailActivity } from "./ConstituentEmailActivity";
import { RelatedBoardTasks } from "./boards/RelatedBoardTasks";
import { GivebutterConstituentSection } from "./integrations/GivebutterConstituentSection";
import { ConstituentMeetingsSection } from "./calendar/ConstituentMeetingsSection";
import { ConstituentEventsSection } from "./constituents/ConstituentEventsSection";
import { GiftsSection } from "./constituents/GiftsSection";
import { LinkedGrantsSection } from "./constituents/LinkedGrantsSection";
import { useNavigate } from "react-router-dom";

type Constituent = Database["public"]["Views"]["constituents_with_ltv"]["Row"];
type Gift = Database["public"]["Tables"]["gifts"]["Row"];

interface ConstituentDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  constituent: Constituent;
}

const ConstituentDetail = ({ open, onOpenChange, constituent }: ConstituentDetailProps) => {
  const navigate = useNavigate();
  const [giftFormOpen, setGiftFormOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [linkGrantOpen, setLinkGrantOpen] = useState(false);
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [quickActionTitle, setQuickActionTitle] = useState("");
  const [majorGiftFormOpen, setMajorGiftFormOpen] = useState(false);
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [softCreditsGift, setSoftCreditsGift] = useState<Gift | null>(null);



  const handleQuickAction = (actionType: string) => {
    setQuickActionTitle(actionType);
    setNoteFormOpen(true);
  };

  const handleNoteSuccess = () => {
    setQuickActionTitle("");
  };

  const handleEditGift = (gift: Gift) => {
    setSelectedGift(gift);
    setGiftFormOpen(true);
  };

  if (!constituent) return null;

  const totalGiving = constituent.total_ltv ? parseFloat(String(constituent.total_ltv)) : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCommunicationBadge = (pref: string) => {
    const colors: Record<string, string> = {
      email: "bg-primary/10 text-primary",
      phone: "bg-secondary/10 text-secondary",
      mail: "bg-accent/10 text-accent",
      sms: "bg-muted/50 text-muted-foreground",
      no_contact: "bg-destructive/10 text-destructive",
    };
    return colors[pref] || "bg-muted";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">360° Constituent View</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quick Actions Bar */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleQuickAction("")}
                    className="gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Log Interaction
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Header Section */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">
                    {constituent.first_name || constituent.last_name
                      ? `${constituent.first_name || ""} ${constituent.last_name || ""}`.trim()
                      : constituent.full_legal_name}
                  </CardTitle>
                  {constituent.title && (
                    <p className="text-sm text-muted-foreground">{constituent.title}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={getCommunicationBadge(constituent.communication_preference || '')}
                    >
                      {constituent.communication_preference}
                    </Badge>
                    
                  </div>
                </div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {constituent.primary_email || "Not provided"}
                    </p>
                    {constituent.primary_email && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEmailComposerOpen(true)}
                        className="ml-2"
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        Send Email
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {(constituent.phone || constituent.mobile_phone) && (
                <>
                  <div className="space-y-2">
                    {constituent.phone && (
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium w-24">Business:</p>
                        <p className="text-sm text-muted-foreground">{constituent.phone}</p>
                      </div>
                    )}
                    {constituent.mobile_phone && (
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium w-24">Mobile:</p>
                        <p className="text-sm text-muted-foreground">{constituent.mobile_phone}</p>
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Address</p>
                  {constituent.mailing_street || constituent.mailing_city ? (
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      {constituent.mailing_street && <p>{constituent.mailing_street}</p>}
                      {(constituent.mailing_city ||
                        constituent.mailing_state ||
                        constituent.mailing_postal_code) && (
                        <p>
                          {[
                            constituent.mailing_city,
                            constituent.mailing_state,
                            constituent.mailing_postal_code,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {constituent.primary_address || "Not provided"}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Household Card (if applicable) */}
          {constituent.household_id && (
            <HouseholdCard
              householdId={constituent.household_id}
              currentConstituentId={constituent.id}
            />
          )}

          {/* Giving Summary - Now uses extracted component */}
          <GiftsSection
            constituentId={constituent.id}
            constituentName={constituent.full_legal_name}
            totalGiving={totalGiving}
            onAddGift={() => {
              setSelectedGift(null);
              setGiftFormOpen(true);
            }}
            onEditGift={handleEditGift}
            onViewSoftCredits={setSoftCreditsGift}
            onTrackMajorGift={() => setMajorGiftFormOpen(true)}
          />

          {/* Soft Credits Summary */}
          {constituent && (
            <SoftCreditSummaryCard
              constituentId={constituent.id}
              totalSoftCreditAmount={
                constituent.total_soft_credit_amount != null
                  ? Number(constituent.total_soft_credit_amount)
                  : undefined
              }
              softCreditCount={constituent.soft_credit_count}
              lastSoftCreditDate={constituent.last_soft_credit_date}
            />
          )}

          {/* Givebutter Integration */}
          {constituent && <GivebutterConstituentSection constituentId={constituent.id} />}

          {/* Soft Credits for Selected Gift */}
          {softCreditsGift && (
            <Dialog open={!!softCreditsGift} onOpenChange={() => setSoftCreditsGift(null)}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Gift Soft Credits</DialogTitle>
                </DialogHeader>
                <SoftCreditsSection
                  giftId={softCreditsGift.id}
                  giftAmount={Number(softCreditsGift.amount)}
                />
              </DialogContent>
            </Dialog>
          )}

          {/* Linked Grants - Now uses extracted component */}
          <LinkedGrantsSection
            constituentId={constituent.id}
            onLinkGrant={() => setLinkGrantOpen(true)}
          />

          {/* Relationships Section */}
          <RelationshipsSection
            constituentId={constituent.id}
            constituentName={constituent.full_legal_name}
          />

          {/* Create Household Button (if not in a household) */}
          {!constituent.household_id && (
            <div className="flex justify-end">
              <CreateHouseholdDialog
                initialMember={{ id: constituent.id, full_legal_name: constituent.full_legal_name }}
              />
            </div>
          )}

          {/* Related Board Tasks */}
          <RelatedBoardTasks
            constituentId={constituent.id}
            constituentName={constituent.full_legal_name}
          />


          {/* Meetings Section */}
          <ConstituentMeetingsSection constituentId={constituent.id} />

          {/* Events & Programs Section */}
          <ConstituentEventsSection
            constituentId={constituent.id}
            constituentEmail={constituent.primary_email}
          />

          {/* Activity Timeline & Learning Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Engagement & Learning</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="activity" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="email">Email</TabsTrigger>
                  <TabsTrigger value="learning">Learning</TabsTrigger>
                </TabsList>

                <TabsContent value="activity" className="mt-4">
                  <ActivityTimeline constituentId={constituent.id} />
                </TabsContent>

                <TabsContent value="email" className="mt-4">
                  <ConstituentEmailActivity
                    constituentId={constituent.id}
                    constituentEmail={constituent.primary_email}
                    constituentName={constituent.full_legal_name}
                  />
                </TabsContent>

                <TabsContent value="learning" className="mt-4">
                  <LMSStudentSection constituentId={constituent.id} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Record Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Record Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(constituent.created_at)}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(constituent.updated_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <GiftForm
          open={giftFormOpen}
          onOpenChange={setGiftFormOpen}
          onSuccess={() => {}}
          constituentId={constituent.id}
          gift={selectedGift}
        />

        <LinkGrantDialog
          open={linkGrantOpen}
          onOpenChange={setLinkGrantOpen}
          constituentId={constituent.id}
          onSuccess={() => {}}
        />

        <ActivityNoteForm
          open={noteFormOpen}
          onOpenChange={(open) => {
            setNoteFormOpen(open);
            if (!open) setQuickActionTitle("");
          }}
          constituentId={constituent.id}
          onSuccess={handleNoteSuccess}
          defaultTitle={quickActionTitle}
        />

        <MajorGiftForm
          open={majorGiftFormOpen}
          onOpenChange={setMajorGiftFormOpen}
          onSuccess={() => {}}
          preselectedConstituentId={constituent.id}
        />

        {/* Email Composer */}
        {constituent.primary_email && (
          <EmailComposer
            open={emailComposerOpen}
            onOpenChange={setEmailComposerOpen}
            constituentId={constituent.id}
            constituentEmail={constituent.primary_email}
            constituentName={constituent.full_legal_name}
            onSuccess={() => {
              window.location.reload();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConstituentDetail;
