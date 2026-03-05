import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Kanban, BarChart3 } from "lucide-react";
import { RecruitmentBoard } from "@/components/pipeline/RecruitmentBoard";
import { RecruitmentAnalytics } from "@/components/pipeline/RecruitmentAnalytics";

const PipelineDashboard = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recruitment Pipeline</h1>
          <p className="text-muted-foreground">
            Track candidates through hiring stages and monitor pipeline performance
          </p>
        </div>

        <Tabs defaultValue="board" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="board" className="gap-2">
              <Kanban className="h-4 w-4" />
              Pipeline Board
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="board">
            <RecruitmentBoard />
          </TabsContent>

          <TabsContent value="analytics">
            <RecruitmentAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PipelineDashboard;
