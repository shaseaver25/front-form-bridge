import Layout from "@/components/Layout";
import ConstituentList from "@/components/ConstituentList";

const Constituents = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground">Manage your contacts and client database</p>
        </div>
        <ConstituentList />
      </div>
    </Layout>
  );
};

export default Constituents;
