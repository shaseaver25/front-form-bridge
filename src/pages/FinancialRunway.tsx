import Layout from "@/components/Layout";
import { FeatureGate } from "@/components/FeatureGate";
import { BurndownUpgradePrompt } from "@/components/burndown/BurndownUpgradePrompt";
import BurndownCalculator from "./BurndownCalculator";

export default function FinancialRunway() {
  return (
    <Layout>
      <FeatureGate 
        feature="burndown_calculator"
        fallback={<BurndownUpgradePrompt />}
      >
        <BurndownCalculator />
      </FeatureGate>
    </Layout>
  );
}
