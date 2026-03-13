import Layout from "@/components/Layout";
import { ESJobsList } from "@/components/exec-search/ESJobsList";

const ExecSearchJobs = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ES Jobs</h1>
          <p className="text-muted-foreground">
            Jobs tagged with "Executive Search"
          </p>
        </div>
        <ESJobsList />
      </div>
    </Layout>
  );
};

export default ExecSearchJobs;
