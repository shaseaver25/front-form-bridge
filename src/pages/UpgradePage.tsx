import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { TIER_FEATURES, type TierFeature } from "@/hooks/useFeatureAccess";
import { useSubscription } from "@/hooks/useSubscription";

const TIER_DETAILS = {
  professional: {
    label: "Professional",
    icon: Zap,
    color: "text-blue-600",
    badgeClass: "bg-blue-100 text-blue-800",
    features: [
      { key: "grants" as TierFeature, icon: "📄" },
      { key: "major_gifts" as TierFeature, icon: "💎" },
      { key: "voice_notes" as TierFeature, icon: "🎙️" },
    ],
  },
  enterprise: {
    label: "Enterprise",
    icon: Star,
    color: "text-purple-600",
    badgeClass: "bg-purple-100 text-purple-800",
    features: [
      { key: "grants" as TierFeature, icon: "📄" },
      { key: "major_gifts" as TierFeature, icon: "💎" },
      { key: "voice_notes" as TierFeature, icon: "🎙️" },
      { key: "burndown" as TierFeature, icon: "📊" },
    ],
  },
} as const;

const UpgradePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { tier: currentTier } = useSubscription();

  const featureKey = searchParams.get("feature") as TierFeature | null;
  const featureInfo = featureKey ? TIER_FEATURES[featureKey] : null;
  const requiredTier = featureInfo?.requiredTier ?? "professional";
  const tierDetail = TIER_DETAILS[requiredTier];
  const TierIcon = tierDetail.icon;

  return (
    <Layout>
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-8">
        {/* Lock icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <Badge className={tierDetail.badgeClass}>
            <TierIcon className="w-3 h-3 mr-1" />
            {tierDetail.label} tier required
          </Badge>
          <h1 className="text-2xl font-bold text-foreground">
            {featureInfo
              ? `${featureInfo.label} is not available on your current plan`
              : "This feature requires an upgrade"}
          </h1>
          <p className="text-muted-foreground">
            {featureInfo?.description ?? "Upgrade to unlock this feature."}
          </p>
        </div>

        {/* What's included in the required tier */}
        <div className="bg-card border border-border rounded-lg p-6 text-left space-y-4">
          <div className="flex items-center gap-2">
            <TierIcon className={`w-5 h-5 ${tierDetail.color}`} />
            <h2 className="font-semibold text-foreground">{tierDetail.label} includes</h2>
          </div>
          <ul className="space-y-3">
            {tierDetail.features.map(({ key, icon }) => (
              <li key={key} className="flex items-start gap-3">
                <span className="text-lg leading-none mt-0.5">{icon}</span>
                <div>
                  <p className="font-medium text-sm text-foreground">{TIER_FEATURES[key].label}</p>
                  <p className="text-xs text-muted-foreground">{TIER_FEATURES[key].description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Current plan note */}
        <p className="text-sm text-muted-foreground">
          Your current plan:{" "}
          <span className="font-medium capitalize text-foreground">{currentTier}</span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go back
          </Button>
          <Button asChild className="gap-2">
            <a href="mailto:hello@tailoredu.org?subject=Upgrade%20Request">
              <TierIcon className="w-4 h-4" />
              Contact us to upgrade
            </a>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default UpgradePage;
