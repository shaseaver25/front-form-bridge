export interface ProfileTabProps {
  profile: Record<string, unknown> | null;
  onSave: (field: string, value: unknown) => void;
  onSaveAll: (updates: Record<string, unknown>) => void;
  onDirty: () => void;
  savedField: string | null;
}
