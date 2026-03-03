import { supabase } from "@/integrations/supabase/client";
import type { ProcessedVoiceData } from "@/types/voice-notes";
import type { Json } from "@/integrations/supabase/types";

interface SaveVoiceNoteParams {
  transcript: string;
  processedData: ProcessedVoiceData;
  eventName?: string;
  durationSeconds?: number;
}

interface SaveResult {
  recordingId: string;
  createdContactIds: string[];
  updatedContactIds: string[];
  createdNextStepIds: string[];
  notesAdded: number;
}

export async function saveVoiceNoteResults({
  transcript,
  processedData,
  eventName,
  durationSeconds,
}: SaveVoiceNoteParams): Promise<SaveResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const createdContactIds: string[] = [];
  const updatedContactIds: string[] = [];
  const createdNextStepIds: string[] = [];
  let notesAdded = 0;

  const { data: recording, error: recordingError } = await supabase
    .from("voice_recordings")
    .insert({
      user_id: user.id,
      transcript,
      transcript_raw: transcript,
      duration_seconds: durationSeconds || null,
      processing_status: "completed" as const,
      processed_data: processedData as unknown as Json,
      event_name: eventName || null,
      event_date: new Date().toISOString().split("T")[0],
    })
    .select("id")
    .single();

  if (recordingError) {
    console.error("Error creating voice recording:", recordingError);
    throw new Error("Failed to save voice recording");
  }

  const recordingId = recording.id;

  for (const contact of processedData.contacts) {
    try {
      if (contact.isNew) {
        const nameParts = contact.name.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const { data: newConstituent, error: constituentError } = await supabase
          .from("constituents")
          .insert({
            first_name: firstName,
            last_name: lastName,
            full_legal_name: contact.name,
            employer: contact.organization || null,
            title: contact.title || null,
            primary_email: contact.email || null,
            phone: contact.phone || null,
            created_by: user.id,
          })
          .select("id")
          .single();

        if (constituentError) {
          console.error("Error creating constituent:", constituentError);
          continue;
        }

        createdContactIds.push(newConstituent.id);

        await supabase.from("voice_contact_updates").insert({
          recording_id: recordingId,
          contact_id: newConstituent.id,
          update_type: "created",
          fields_updated: {
            first_name: firstName,
            last_name: lastName,
            employer: contact.organization,
            title: contact.title,
            primary_email: contact.email,
            phone: contact.phone,
          },
        });
      } else if (contact.linkedContactId) {
        const { data: existing } = await supabase
          .from("constituents")
          .select("*")
          .eq("id", contact.linkedContactId)
          .single();

        if (existing) {
          const updates: Record<string, string | null> = {};
          if (!existing.employer && contact.organization) updates.employer = contact.organization;
          if (!existing.title && contact.title) updates.title = contact.title;
          if (!existing.primary_email && contact.email) updates.primary_email = contact.email;
          if (!existing.phone && contact.phone) updates.phone = contact.phone;

          if (Object.keys(updates).length > 0) {
            await supabase.from("constituents").update(updates).eq("id", contact.linkedContactId);
            updatedContactIds.push(contact.linkedContactId);
            await supabase.from("voice_contact_updates").insert({
              recording_id: recordingId,
              contact_id: contact.linkedContactId,
              update_type: "updated",
              fields_updated: updates,
            });
          }
        }
      }
    } catch (err) {
      console.error("Error processing contact:", contact.name, err);
    }
  }

  for (const note of processedData.notes) {
    try {
      let contactId: string | null = null;
      const matchingCreated = processedData.contacts.find(
        c => c.name.toLowerCase() === note.contactName.toLowerCase() && c.isNew
      );
      if (matchingCreated) {
        const { data: foundContact } = await supabase
          .from("constituents").select("id")
          .eq("full_legal_name", matchingCreated.name)
          .order("created_at", { ascending: false }).limit(1).single();
        contactId = foundContact?.id || null;
      }
      const matchingExisting = processedData.contacts.find(
        c => c.name.toLowerCase() === note.contactName.toLowerCase() && !c.isNew
      );
      if (matchingExisting?.linkedContactId) contactId = matchingExisting.linkedContactId;
      if (!contactId && note.contactName && note.contactName !== "General") {
        const { data: foundByName } = await supabase
          .from("constituents").select("id")
          .ilike("full_legal_name", `%${note.contactName}%`).limit(1).single();
        contactId = foundByName?.id || null;
      }
      if (contactId) {
        await supabase.from("activities").insert({
          constituent_id: contactId,
          activity_type: "voice_note",
          title: `Voice Note: ${eventName || "Networking"}`,
          description: note.content,
          created_by: user.id,
          metadata: { recording_id: recordingId, event_name: eventName || null },
        });
        await supabase.from("voice_contact_updates").insert({
          recording_id: recordingId, contact_id: contactId,
          update_type: "note_added", note_content: note.content, fields_updated: {},
        });
        notesAdded++;
      }
    } catch (err) {
      console.error("Error adding note:", note.contactName, err);
    }
  }

  for (const step of processedData.nextSteps) {
    try {
      let contactId: string | null = null;
      if (step.contactName) {
        const matchingContact = processedData.contacts.find(
          c => c.name.toLowerCase() === step.contactName?.toLowerCase()
        );
        if (matchingContact?.linkedContactId) contactId = matchingContact.linkedContactId;
        else if (matchingContact?.isNew) {
          const { data: foundContact } = await supabase
            .from("constituents").select("id")
            .eq("full_legal_name", matchingContact.name)
            .order("created_at", { ascending: false }).limit(1).single();
          contactId = foundContact?.id || null;
        } else {
          const { data: foundByName } = await supabase
            .from("constituents").select("id")
            .ilike("full_legal_name", `%${step.contactName}%`).limit(1).single();
          contactId = foundByName?.id || null;
        }
      }
      const { data: nextStep, error: nextStepError } = await supabase
        .from("voice_next_steps")
        .insert({
          recording_id: recordingId, contact_id: contactId,
          assigned_to: user.id, created_by: user.id,
          title: step.action,
          description: step.contactName ? `Related to: ${step.contactName}` : null,
          due_date: step.suggestedDueDate || null, priority: step.priority, status: "pending",
        })
        .select("id").single();
      if (!nextStepError && nextStep) createdNextStepIds.push(nextStep.id);
      await supabase.from("tasks").insert({
        title: step.action,
        description: step.contactName
          ? `From voice note: ${eventName || "Recording"}\nRelated to: ${step.contactName}`
          : `From voice note: ${eventName || "Recording"}`,
        assigned_to: user.id, created_by: user.id,
        due_date: step.suggestedDueDate || null, status: "pending", source_type: "voice_note",
      });
    } catch (err) {
      console.error("Error creating next step:", step.action, err);
    }
  }

  return { recordingId, createdContactIds, updatedContactIds, createdNextStepIds, notesAdded };
}
