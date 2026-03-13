import Layout from "@/components/Layout";
import { ESCompaniesList } from "@/components/exec-search/ESCompaniesList";

const ExecSearchCompanies = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ES Companies</h1>
          <p className="text-muted-foreground">
            Companies tagged with "Executive Search"
          </p>
        </div>
        <ESCompaniesList />
      </div>
    </Layout>
  );
};

export default ExecSearchCompanies;
