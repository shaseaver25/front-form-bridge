import Layout from "@/components/Layout";
import { ESContactsList } from "@/components/exec-search/ESContactsList";

const ExecSearchContacts = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ES Contacts</h1>
          <p className="text-muted-foreground">
            Contacts tagged with "Executive Search"
          </p>
        </div>
        <ESContactsList />
      </div>
    </Layout>
  );
};

export default ExecSearchContacts;
