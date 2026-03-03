import { useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Users, Mic, GraduationCap, Backpack } from "lucide-react";
import { PoolApplicationList } from "@/components/talent-pool/PoolApplicationList";
import { AddPoolApplicationDialog } from "@/components/talent-pool/AddPoolApplicationDialog";
import { PoolType } from "@/hooks/usePoolApplications";

export default function TalentPool() {
  const [activeTab, setActiveTab] = useState<PoolType | "all">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [defaultPoolType, setDefaultPoolType] = useState<PoolType>("speaker");

  const handleAddApplication = (poolType: PoolType) => {
    setDefaultPoolType(poolType);
    setIsAddDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Talent Pool</h1>
            <p className="text-muted-foreground">
              Manage speakers, teachers, and interns for your education programs
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleAddApplication("speaker")} variant="outline">
              <Mic className="mr-2 h-4 w-4" />
              Add Speaker
            </Button>
            <Button onClick={() => handleAddApplication("teacher")} variant="outline">
              <GraduationCap className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
            <Button onClick={() => window.open("/apply/intern", "_blank")}>
              <Backpack className="mr-2 h-4 w-4" />
              Intern Application
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PoolType | "all")}>
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Users className="h-4 w-4" />
              All Talent
            </TabsTrigger>
            <TabsTrigger value="speaker" className="gap-2">
              <Mic className="h-4 w-4" />
              AI Whisperers Speakers
            </TabsTrigger>
            <TabsTrigger value="teacher" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              createMPLS Teachers
            </TabsTrigger>
            <TabsTrigger value="intern" className="gap-2">
              <Backpack className="h-4 w-4" />
              Interns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <PoolApplicationList />
          </TabsContent>

          <TabsContent value="speaker" className="mt-6">
            <PoolApplicationList poolType="speaker" />
          </TabsContent>

          <TabsContent value="teacher" className="mt-6">
            <PoolApplicationList poolType="teacher" />
          </TabsContent>

          <TabsContent value="intern" className="mt-6">
            <PoolApplicationList poolType="intern" />
          </TabsContent>
        </Tabs>
      </div>

      <AddPoolApplicationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        defaultPoolType={defaultPoolType}
      />
    </Layout>
  );
}
