import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CollaborationToolbar } from "@/components/collaboration/CollaborationToolbar";
import { ActivityStream } from "@/components/collaboration/ActivityStream";
import { CommentThread } from "@/components/collaboration/CommentThread";
import { PresenceIndicator } from "@/components/collaboration/PresenceIndicator";
import { Users, MessageSquare, Activity, Lock, Zap, Eye, Edit, Share2 } from "lucide-react";

// Demo record ID for the collaboration features
const DEMO_RECORD_ID = "demo-collaboration-record";
const DEMO_RECORD_TYPE = "constituent";

export default function CollaborationDemo() {
  const [showActivity, setShowActivity] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const demoFields = [
    { name: "name", label: "Name", value: "John Smith" },
    { name: "email", label: "Email", value: "john.smith@example.com" },
    { name: "phone", label: "Phone", value: "(555) 123-4567" },
    { name: "status", label: "Status", value: "Active Donor" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Real-Time Collaboration Demo</h1>
            <p className="text-muted-foreground mt-1">
              Experience multi-user collaboration features in action
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Zap className="h-4 w-4 mr-2 text-yellow-500" />
            Live Demo
          </Badge>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold">Presence</p>
                  <p className="text-sm text-muted-foreground">See who's viewing</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Activity className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">Activity Stream</p>
                  <p className="text-sm text-muted-foreground">Real-time updates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <MessageSquare className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="font-semibold">Comments</p>
                  <p className="text-sm text-muted-foreground">Threaded discussions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Lock className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold">Field Locking</p>
                  <p className="text-sm text-muted-foreground">Prevent conflicts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Collaboration Toolbar Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Collaboration Toolbar
            </CardTitle>
            <CardDescription>
              The toolbar shows who's currently viewing the record and provides quick access to collaboration features
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <CollaborationToolbar
              recordType={DEMO_RECORD_TYPE}
              recordId={DEMO_RECORD_ID}
              onShowActivity={() => setShowActivity(!showActivity)}
              onShowComments={() => setShowComments(!showComments)}
            />
          </CardContent>
        </Card>

        {/* Main Demo Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Record Editor */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Demo Record
              </CardTitle>
              <CardDescription>
                Click on a field to see field-level collaboration features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {demoFields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{field.label}</label>
                    {selectedField === field.name && (
                      <Badge variant="secondary" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Field selected
                      </Badge>
                    )}
                  </div>
                  <Input
                    value={field.value}
                    readOnly
                    className={`cursor-pointer transition-colors ${
                      selectedField === field.name 
                        ? "ring-2 ring-primary border-primary" 
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedField(field.name)}
                  />
                </div>
              ))}

              <Separator className="my-4" />

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Click a field to view field-specific comments</li>
                  <li>When editing, your changes are broadcast live</li>
                  <li>Field locks prevent editing conflicts</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Activity & Comments */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Activity Stream
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="mt-4">
                <ActivityStream
                  recordType={DEMO_RECORD_TYPE}
                  recordId={DEMO_RECORD_ID}
                />
              </TabsContent>

              <TabsContent value="comments" className="mt-4">
                <CommentThread
                  recordType={DEMO_RECORD_TYPE}
                  recordId={DEMO_RECORD_ID}
                  fieldName={selectedField || undefined}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* How to Use Section */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use Collaboration Features</CardTitle>
            <CardDescription>
              Integrate real-time collaboration into any record in your CRM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Presence Tracking
                </h4>
                <p className="text-sm text-muted-foreground">
                  See who's viewing a record in real-time. Avatars show online status and editing indicators.
                  Hover over an avatar to see when they started viewing.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  Activity Stream
                </h4>
                <p className="text-sm text-muted-foreground">
                  Every change to a record is logged automatically. See field updates, comments, 
                  status changes, and file uploads in a live feed.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  Comments & Reactions
                </h4>
                <p className="text-sm text-muted-foreground">
                  Add comments to records or specific fields. Support for threaded replies, 
                  emoji reactions, and @mentions. Mark comments as resolved when done.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-orange-500" />
                  Field Locking
                </h4>
                <p className="text-sm text-muted-foreground">
                  When you start editing a field, it's locked for other users. This prevents 
                  conflicting changes and ensures data integrity.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
