import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { NewCustomerWizardState } from "@/types/saas-wizard";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface StepBasicsProps {
  data: NewCustomerWizardState;
  onUpdate: (updates: Partial<NewCustomerWizardState>) => void;
  onNext: () => void;
}

interface ValidationErrors {
  name?: string;
  slug?: string;
  organization_type?: string;
  contact_name?: string;
  contact_email?: string;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
}

function validateSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length > 0;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function StepBasics({ data, onUpdate, onNext }: StepBasicsProps) {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Auto-generate slug from name if not manually edited
  useEffect(() => {
    if (!slugManuallyEdited && data.name) {
      onUpdate({ slug: generateSlug(data.name) });
    }
  }, [data.name, slugManuallyEdited, onUpdate]);

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!data.name.trim()) {
      newErrors.name = "Organization name is required";
    } else if (data.name.length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    if (!data.slug.trim()) {
      newErrors.slug = "URL slug is required";
    } else if (!validateSlug(data.slug)) {
      newErrors.slug = "Slug must contain only lowercase letters, numbers, and hyphens";
    }

    if (!data.organization_type) {
      newErrors.organization_type = "Organization type is required";
    }

    if (!data.contact_name.trim()) {
      newErrors.contact_name = "Contact name is required";
    } else if (data.contact_name.length > 100) {
      newErrors.contact_name = "Name must be less than 100 characters";
    }

    if (!data.contact_email.trim()) {
      newErrors.contact_email = "Contact email is required";
    } else if (!validateEmail(data.contact_email)) {
      newErrors.contact_email = "Please enter a valid email address";
    } else if (data.contact_email.length > 255) {
      newErrors.contact_email = "Email must be less than 255 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    // Sanitize as they type
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    onUpdate({ slug: sanitized });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Organization Basics</h2>
        <p className="text-muted-foreground text-sm">
          Enter the basic information about this customer organization.
        </p>
      </div>

      <div className="grid gap-4">
        {/* Organization Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Organization Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Enter organization name"
            maxLength={100}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* URL Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug">
            URL Slug <span className="text-destructive">*</span>
          </Label>
          <Input
            id="slug"
            value={data.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="organization-slug"
            maxLength={50}
          />
          {data.slug && (
            <p className="text-sm text-muted-foreground">
              Will be: <span className="font-mono">crm4{data.slug}.vercel.app</span>
            </p>
          )}
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug}</p>
          )}
        </div>

        {/* Organization Type */}
        <div className="space-y-2">
          <Label htmlFor="organization_type">
            Organization Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.organization_type}
            onValueChange={(value) =>
              onUpdate({
                organization_type: value as NewCustomerWizardState["organization_type"],
                template_id: "", // Reset template when type changes
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select organization type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nonprofit">Nonprofit</SelectItem>
              <SelectItem value="education">Educational Institution</SelectItem>
              <SelectItem value="small_business">Small Business</SelectItem>
            </SelectContent>
          </Select>
          {errors.organization_type && (
            <p className="text-sm text-destructive">{errors.organization_type}</p>
          )}
        </div>

        {/* Contact Name */}
        <div className="space-y-2">
          <Label htmlFor="contact_name">
            Primary Contact Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact_name"
            value={data.contact_name}
            onChange={(e) => onUpdate({ contact_name: e.target.value })}
            placeholder="Enter contact name"
            maxLength={100}
          />
          {errors.contact_name && (
            <p className="text-sm text-destructive">{errors.contact_name}</p>
          )}
        </div>

        {/* Contact Email */}
        <div className="space-y-2">
          <Label htmlFor="contact_email">
            Contact Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact_email"
            type="email"
            value={data.contact_email}
            onChange={(e) => onUpdate({ contact_email: e.target.value })}
            placeholder="email@organization.com"
            maxLength={255}
          />
          {errors.contact_email && (
            <p className="text-sm text-destructive">{errors.contact_email}</p>
          )}
        </div>

        {/* Contact Phone */}
        <div className="space-y-2">
          <Label htmlFor="contact_phone">Contact Phone (optional)</Label>
          <Input
            id="contact_phone"
            type="tel"
            value={data.contact_phone}
            onChange={(e) => onUpdate({ contact_phone: e.target.value })}
            placeholder="(555) 555-5555"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={() => navigate("/admin/customers")}>
          Cancel
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
}
