import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContactEditData {
  first_name: string;
  last_name: string;
  job_title: string;
  contact_type: string;
  status: string;
  description: string;
  salutation: string;
  middle_name: string;
  nick_name: string;
  suffix: string;
  salary: string;
  salary_details: string;
  desired_salary_min: string;
  desired_salary_max: string;
}

export interface EditableEmail {
  id?: string;
  value: string;
  category: string;
  is_primary: boolean;
  _deleted?: boolean;
}

export interface EditablePhone {
  id?: string;
  value: string;
  category: string;
  is_primary: boolean;
  extension?: string;
  _deleted?: boolean;
}

export interface EditableUrl {
  id?: string;
  value: string;
  category: string;
  is_primary: boolean;
  _deleted?: boolean;
}

export interface EditableAddress {
  id?: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  category: string;
  is_primary: boolean;
  _deleted?: boolean;
}

export function useContactEdit(contactId: string, onSaved: () => void) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<ContactEditData>({
    first_name: "",
    last_name: "",
    job_title: "",
    contact_type: "candidate",
    status: "active",
    description: "",
    salutation: "",
    middle_name: "",
    nick_name: "",
    suffix: "",
    salary: "",
    salary_details: "",
    desired_salary_min: "",
    desired_salary_max: "",
  });
  const [editEmails, setEditEmails] = useState<EditableEmail[]>([]);
  const [editPhones, setEditPhones] = useState<EditablePhone[]>([]);
  const [editUrls, setEditUrls] = useState<EditableUrl[]>([]);
  const [editAddresses, setEditAddresses] = useState<EditableAddress[]>([]);

  const startEditing = useCallback(
    (contact: any, emails: any[], phones: any[], urls: any[], addresses: any[]) => {
      setEditData({
        first_name: contact.first_name || "",
        last_name: contact.last_name || "",
        job_title: contact.job_title || "",
        contact_type: contact.contact_type || "candidate",
        status: contact.status || "active",
        description: contact.description || "",
        salutation: contact.salutation || "",
        middle_name: contact.middle_name || "",
        nick_name: contact.nick_name || "",
        suffix: contact.suffix || "",
        salary: contact.salary?.toString() || "",
        salary_details: contact.salary_details || "",
        desired_salary_min: contact.desired_salary_min?.toString() || "",
        desired_salary_max: contact.desired_salary_max?.toString() || "",
      });
      setEditEmails(
        emails.map((e) => ({
          id: e.id,
          value: e.value,
          category: e.category,
          is_primary: e.is_primary,
        }))
      );
      setEditPhones(
        phones.map((p) => ({
          id: p.id,
          value: p.value,
          category: p.category,
          is_primary: p.is_primary,
          extension: p.extension || "",
        }))
      );
      setEditUrls(
        urls.map((u) => ({
          id: u.id,
          value: u.value,
          category: u.category,
          is_primary: u.is_primary,
        }))
      );
      setEditAddresses(
        addresses.map((a) => ({
          id: a.id,
          line1: a.line1 || "",
          line2: a.line2 || "",
          city: a.city || "",
          state: a.state || "",
          zip_code: a.zip_code || "",
          country: a.country || "",
          category: a.category || "business",
          is_primary: a.is_primary,
        }))
      );
      setEditing(true);
    },
    []
  );

  const cancelEditing = useCallback(() => {
    setEditing(false);
  }, []);

  const save = useCallback(async () => {
    if (!editData.last_name.trim()) {
      toast.error("Last name is required");
      return;
    }

    setSaving(true);

    try {
      // 1. Update contact
      const { error: contactError } = await supabase
        .from("crm_contacts")
        .update({
          first_name: editData.first_name || null,
          last_name: editData.last_name,
          job_title: editData.job_title || null,
          contact_type: editData.contact_type,
          status: editData.status,
          description: editData.description || null,
          salutation: editData.salutation || null,
          middle_name: editData.middle_name || null,
          nick_name: editData.nick_name || null,
          suffix: editData.suffix || null,
          salary: editData.salary ? parseFloat(editData.salary) : null,
          salary_details: editData.salary_details || null,
          desired_salary_min: editData.desired_salary_min ? parseFloat(editData.desired_salary_min) : null,
          desired_salary_max: editData.desired_salary_max ? parseFloat(editData.desired_salary_max) : null,
        })
        .eq("id", contactId);

      if (contactError) throw contactError;

      // 2. Sync emails
      await syncMultiValue(
        "crm_contact_emails",
        contactId,
        editEmails,
        (e) => ({ value: e.value, category: e.category, is_primary: e.is_primary })
      );

      // 3. Sync phones
      await syncMultiValue(
        "crm_contact_phones",
        contactId,
        editPhones,
        (p) => ({ value: p.value, category: p.category, is_primary: p.is_primary, extension: p.extension || null })
      );

      // 4. Sync urls
      await syncMultiValue(
        "crm_contact_urls",
        contactId,
        editUrls,
        (u) => ({ value: u.value, category: u.category, is_primary: u.is_primary })
      );

      // 5. Sync addresses
      await syncMultiValue(
        "crm_addresses",
        contactId,
        editAddresses,
        (a) => ({
          line1: a.line1 || null,
          line2: a.line2 || null,
          city: a.city || null,
          state: a.state || null,
          zip_code: a.zip_code || null,
          country: a.country || null,
          category: a.category,
          is_primary: a.is_primary,
        })
      );

      toast.success("Contact updated");
      setEditing(false);
      onSaved();
    } catch (err: any) {
      toast.error("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }, [contactId, editData, editEmails, editPhones, editUrls, editAddresses, onSaved]);

  return {
    editing,
    saving,
    editData,
    setEditData,
    editEmails,
    setEditEmails,
    editPhones,
    setEditPhones,
    editUrls,
    setEditUrls,
    editAddresses,
    setEditAddresses,
    startEditing,
    cancelEditing,
    save,
  };
}

async function syncMultiValue(
  table: string,
  contactId: string,
  items: Array<{ id?: string; _deleted?: boolean; [key: string]: any }>,
  toFields: (item: any) => Record<string, any>
) {
  for (const item of items) {
    if (item._deleted && item.id) {
      await supabase.from(table as any).delete().eq("id", item.id);
    } else if (item.id && !item._deleted) {
      await supabase.from(table as any).update(toFields(item)).eq("id", item.id);
    } else if (!item.id && !item._deleted) {
      const fields = toFields(item);
      // Filter out empty values for required fields
      if (!fields.value && table !== "crm_addresses") continue;
      await supabase.from(table as any).insert({ ...fields, contact_id: contactId });
    }
  }
}
