import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, Heart, Users, Gift, Building2 } from "lucide-react";
import { useDonationCampaign, useCreateCheckoutSession } from "@/hooks/useDonations";
import { toast } from "sonner";

const SUGGESTED_AMOUNTS = [25, 50, 100, 250, 500];
const FUND_DESIGNATIONS = ["General Fund", "Full STEM Program", "AI Whisperers", "Scholarships"];

export default function PublicDonationPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: campaign, isLoading } = useDonationCampaign(slug);
  const createCheckout = useCreateCheckoutSession();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [frequency, setFrequency] = useState<"one-time" | "monthly">("one-time");
  const [fundDesignation, setFundDesignation] = useState("General Fund");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [options, setOptions] = useState({
    isTribute: false,
    tributeType: "in_honor" as "in_honor" | "in_memory",
    tributeName: "",
    coverFees: true,
    isAnonymous: false,
    employerMatch: false,
    employerName: "",
  });

  const amount = selectedAmount || parseFloat(customAmount) || 0;
  const feeAmount = options.coverFees ? amount * 0.029 + 0.3 : 0;
  const totalAmount = amount + feeAmount;

  const handleAmountSelect = (value: number) => {
    setSelectedAmount(value);
    setCustomAmount("");
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || amount < 5) {
      toast.error("Minimum donation is $5");
      return;
    }

    if (!formData.email) {
      toast.error("Email is required");
      return;
    }

    try {
      const result = await createCheckout.mutateAsync({
        amount,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        isRecurring: frequency === "monthly",
        frequency: frequency === "monthly" ? "monthly" : undefined,
        fundDesignation,
        campaignId: campaign?.id,
        coverFees: options.coverFees,
        isTribute: options.isTribute,
        tributeType: options.isTribute ? options.tributeType : undefined,
        tributeName: options.isTribute ? options.tributeName : undefined,
        isAnonymous: options.isAnonymous,
        successUrl: `${window.location.origin}/donation-success`,
        cancelUrl: window.location.href,
      });

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Skeleton className="h-64 w-full mb-6 rounded-lg" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-6" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const progress = campaign?.goal_amount
    ? ((campaign.current_amount || 0) / campaign.goal_amount) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">createMPLS</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Campaign Hero */}
        {campaign?.hero_image_url && (
          <div className="rounded-xl overflow-hidden mb-6 aspect-video bg-muted">
            <img
              src={campaign.hero_image_url}
              alt={campaign.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Campaign Info */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-3">
            {campaign?.name || "Support createMPLS"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {campaign?.description ||
              "Help us expand STEM education to more Minneapolis students!"}
          </p>
        </div>

        {/* Progress Bar */}
        {campaign?.show_progress_bar && campaign?.goal_amount && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <Progress value={Math.min(progress, 100)} className="h-3 mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold">
                    ${(campaign.current_amount || 0).toLocaleString()}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    of ${campaign.goal_amount.toLocaleString()} goal
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{campaign.donor_count || 0} donors</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Donation Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Select Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount Selection */}
              <div className="grid grid-cols-3 gap-3">
                {SUGGESTED_AMOUNTS.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={selectedAmount === value ? "default" : "outline"}
                    className="h-14 text-lg font-semibold"
                    onClick={() => handleAmountSelect(value)}
                  >
                    ${value}
                  </Button>
                ))}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    placeholder="Other"
                    value={customAmount}
                    onChange={(e) => handleCustomAmount(e.target.value)}
                    className={`h-14 pl-7 text-lg font-semibold ${
                      customAmount ? "border-primary ring-1 ring-primary" : ""
                    }`}
                    min="5"
                  />
                </div>
              </div>

              {/* Frequency */}
              <div className="space-y-3">
                <Label className="text-base">Frequency</Label>
                <RadioGroup
                  value={frequency}
                  onValueChange={(v) => setFrequency(v as "one-time" | "monthly")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="one-time" id="one-time" />
                    <Label htmlFor="one-time" className="font-normal cursor-pointer">
                      One-time gift
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="font-normal cursor-pointer">
                      Monthly recurring gift
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Fund Designation */}
              <div className="space-y-2">
                <Label>Designation</Label>
                <Select value={fundDesignation} onValueChange={setFundDesignation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FUND_DESIGNATIONS.map((fund) => (
                      <SelectItem key={fund} value={fund}>
                        {fund}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Donor Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="tribute"
                    checked={options.isTribute}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, isTribute: checked as boolean })
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="tribute" className="font-normal cursor-pointer">
                      <Gift className="h-4 w-4 inline mr-1" />
                      Make this gift in honor or memory of someone
                    </Label>
                  </div>
                </div>

                {options.isTribute && (
                  <div className="ml-6 space-y-3">
                    <RadioGroup
                      value={options.tributeType}
                      onValueChange={(v) =>
                        setOptions({ ...options, tributeType: v as "in_honor" | "in_memory" })
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="in_honor" id="in_honor" />
                        <Label htmlFor="in_honor" className="font-normal">
                          In Honor Of
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="in_memory" id="in_memory" />
                        <Label htmlFor="in_memory" className="font-normal">
                          In Memory Of
                        </Label>
                      </div>
                    </RadioGroup>
                    <Input
                      placeholder="Honoree's name"
                      value={options.tributeName}
                      onChange={(e) =>
                        setOptions({ ...options, tributeName: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="coverFees"
                    checked={options.coverFees}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, coverFees: checked as boolean })
                    }
                  />
                  <Label htmlFor="coverFees" className="font-normal cursor-pointer">
                    I'd like to cover the ${feeAmount.toFixed(2)} processing fee
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="anonymous"
                    checked={options.isAnonymous}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, isAnonymous: checked as boolean })
                    }
                  />
                  <Label htmlFor="anonymous" className="font-normal cursor-pointer">
                    Make my donation anonymous
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total & Submit */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg">Total</span>
                <span className="text-2xl font-bold">
                  ${totalAmount.toFixed(2)}
                  {options.coverFees && amount > 0 && (
                    <span className="text-sm text-muted-foreground font-normal ml-2">
                      (includes fee)
                    </span>
                  )}
                </span>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full text-lg h-14"
                disabled={!amount || amount < 5 || createCheckout.isPending}
              >
                {createCheckout.isPending ? (
                  "Processing..."
                ) : (
                  <>Complete ${totalAmount.toFixed(2)} Donation</>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>Secure payment processed by Stripe</span>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
