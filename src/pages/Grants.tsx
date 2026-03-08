import Layout from "@/components/Layout";
import GrantList from "@/components/GrantList";
import TaskList from "@/components/TaskList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Grants = () => {
  return (
    <Layout>
      <Tabs defaultValue="grants" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="grants">Job Openings</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="grants">
          <GrantList />
        </TabsContent>
        <TabsContent value="tasks">
          <TaskList showAll={true} />
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default Grants;
