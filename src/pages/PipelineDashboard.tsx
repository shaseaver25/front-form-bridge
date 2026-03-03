import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Activity } from "lucide-react";
import { GiftPipelineHealth } from "@/components/pipeline/GiftPipelineHealth";
import { ProgrammingHealth } from "@/components/pipeline/ProgrammingHealth";

const PipelineDashboard = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pipeline Health Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor gift pipeline and programming health across your organization
          </p>
        </div>

        <Tabs defaultValue="gift-pipeline" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="gift-pipeline" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Gift Pipeline
            </TabsTrigger>
            <TabsTrigger value="programming" className="gap-2">
              <Activity className="h-4 w-4" />
              Programming
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gift-pipeline">
            <GiftPipelineHealth />
          </TabsContent>

          <TabsContent value="programming">
            <ProgrammingHealth />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PipelineDashboard;
