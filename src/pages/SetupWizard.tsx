import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Bot,
  Plug,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SetupState {
  org_name: string;
  org_type: string;
  contact_name: string;
  contact_email: string;
  enable_mailchimp: boolean;
  enable_quickbooks: boolean;
  enable_stripe: boolean;
  enable_salesforce: boolean;
}

const INITIAL_STATE: SetupState = {
  org_name: "",
  org_type: "nonprofit",
  contact_name: "",
  contact_email: "",
  enable_mailchimp: false,
  enable_quickbooks: false,
  enable_stripe: false,
  enable_salesforce: false,
};

const ORG_TYPES = [
  { value: "nonprofit", label: "Nonprofit / NGO" },
  { value: "education", label: "Education" },
  { value: "small_business", label: "Small Business" },
  { value: "other", label: "Other" },
];

const INTEGRATIONS = [
  {
    key: "enable_mailchimp" as keyof SetupState,
    name: "Mailchimp",
    description: "Email marketing campaigns",
    icon: "📧",
  },
  {
    key: "enable_quickbooks" as keyof SetupState,
    name: "QuickBooks",
    description: "Financial sync & reporting",
    icon: "📊",
  },
  {
    key: "enable_stripe" as keyof SetupState,
    name: "Stripe",
    description: "Payment processing & donations",
    icon: "💳",
  },
  {
    key: "enable_salesforce" as keyof SetupState,
    name: "Salesforce",
    description: "CRM data import & sync",
    icon: "☁️",
  },
];

// ─── Step indicators ─────────────────────────────────────────────────────────

const STEPS = [
  { label: "Organization", icon: Building2 },
  { label: "Integrations", icon: Plug },
  { label: "Done", icon: CheckCircle2 },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SetupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<SetupState>(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load any existing progress from instance_config
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
        return;
      }

      supabase
        .from("instance_config")
        .select("key, value")
        .eq("key", "org_profile")
        .maybeSingle()
        .then(({ data }) => {
          if (data?.value && typeof data.value === "object") {
            const v = data.value as Record<string, any>;
            setState((prev) => ({
              ...prev,
              org_name: v.org_name ?? prev.org_name,
              org_type: v.org_type ?? prev.org_type,
              contact_name: v.contact_name ?? prev.contact_name,
              contact_email: v.contact_email ?? prev.contact_email,
            }));
          }
        });
    });
  }, [navigate]);

  const update = (field: keyof SetupState, value: string | boolean) =>
    setState((prev) => ({ ...prev, [field]: value }));

  const saveProgress = async (completed = false) => {
    setSaving(true);
    setError(null);

    try {
      // Save org profile
      await supabase.from("instance_config").upsert(
        {
          key: "org_profile",
          value: {
            org_name: state.org_name,
            org_type: state.org_type,
            contact_name: state.contact_name,
            contact_email: state.contact_email,
            integrations: {
              mailchimp: state.enable_mailchimp,
              quickbooks: state.enable_quickbooks,
              stripe: state.enable_stripe,
              salesforce: state.enable_salesforce,
            },
          } as any,
        },
        { onConflict: "key" }
      );

      if (completed) {
        await supabase.from("instance_config").upsert(
          {
            key: "setup_completed",
            value: { completed_at: new Date().toISOString() } as any,
          },
          { onConflict: "key" }
        );
      }

      setSaving(false);
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to save");
      setSaving(false);
      return false;
    }
  };

  const next = async () => {
    const ok = await saveProgress(false);
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    const ok = await saveProgress(true);
    if (ok) navigate("/");
  };

  const skip = () => navigate("/");

  // ─── Step content ───────────────────────────────────────────────────────────

  const stepContent = [
    // Step 0: Organization
    <div key="org" className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Tell us about your organization</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This helps personalize your CRM experience.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Organization Name</Label>
          <Input
            placeholder="e.g. Greenfield Community Foundation"
            value={state.org_name}
            onChange={(e) => update("org_name", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Organization Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {ORG_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => update("org_type", t.value)}
                className={cn(
                  "rounded-lg border px-4 py-2.5 text-sm text-left transition-colors",
                  state.org_type === t.value
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border hover:border-primary/50"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Primary Contact Name</Label>
            <Input
              placeholder="Jane Smith"
              value={state.contact_name}
              onChange={(e) => update("contact_name", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Contact Email</Label>
            <Input
              type="email"
              placeholder="jane@example.org"
              value={state.contact_email}
              onChange={(e) => update("contact_email", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>,

    // Step 1: Integrations
    <div key="integrations" className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Connect your tools</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select which integrations you'd like to set up. You can configure each one after
          finishing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {INTEGRATIONS.map((integration) => {
          const enabled = state[integration.key] as boolean;
          return (
            <button
              key={integration.key}
              onClick={() => update(integration.key, !enabled)}
              className={cn(
                "flex items-center gap-4 rounded-lg border px-4 py-3 text-left transition-colors w-full",
                enabled ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              )}
            >
              <span className="text-2xl">{integration.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", enabled && "text-primary")}>
                  {integration.name}
                </p>
                <p className="text-xs text-muted-foreground">{integration.description}</p>
              </div>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  enabled ? "border-primary bg-primary" : "border-muted-foreground/40"
                )}
              >
                {enabled && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Each integration has its own settings page where you'll complete the connection.
      </p>
    </div>,

    // Step 2: Done
    <div key="done" className="space-y-6 text-center py-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-secondary" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold">
          {state.org_name ? `${state.org_name} is all set!` : "You're all set!"}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Your CRM is configured and ready to go. Head to the dashboard to start adding donors,
          events, and grants.
        </p>
      </div>

      <div className="rounded-lg bg-muted/40 border p-4 text-left space-y-2">
        <p className="text-sm font-medium">What's next:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          {[...INTEGRATIONS]
            .filter((i) => state[i.key])
            .map((i) => (
              <li key={i.key} className="flex gap-2">
                <span className="text-amber-500">○</span>
                Complete {i.name} setup in Settings → Integrations
              </li>
            ))}
          <li className="flex gap-2">
            <span className="text-primary">→</span> Import your donor data or add constituents
            manually
          </li>
        </ul>
      </div>
    </div>,
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo + title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">cM CRM</span>
          </div>
          <p className="text-muted-foreground text-sm">Let's get your CRM set up</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center mb-8 gap-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                      isDone && "bg-primary text-primary-foreground",
                      isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                      !isDone && !isActive && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-12 mx-1 mb-4 transition-colors",
                      i < step ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-6 space-y-6">
          {stepContent[step]}

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {step > 0 && (
                <Button variant="ghost" onClick={back} disabled={saving}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {step < STEPS.length - 1 && (
                <Button variant="ghost" onClick={skip} className="text-muted-foreground text-sm">
                  Skip for now
                </Button>
              )}

              {step < STEPS.length - 1 ? (
                <Button onClick={next} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={finish} disabled={saving} className="px-8">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Go to Dashboard
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
