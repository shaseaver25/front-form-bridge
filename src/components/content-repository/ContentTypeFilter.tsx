import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  mission_statement: "Mission Statement",
  program_description: "Program Description",
  impact_narrative: "Impact Narrative",
  budget_template: "Budget Template",
  boilerplate_text: "Boilerplate Text",
  organizational_history: "Organizational History",
  staff_bio: "Staff Bio",
  board_member_bio: "Board Member Bio",
  outcome_metric: "Outcome Metric",
  partnership_description: "Partnership Description",
  other: "Other",
};

export const CONTENT_TYPE_COLORS: Record<string, string> = {
  mission_statement: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  program_description: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  impact_narrative: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  budget_template: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  boilerplate_text: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  organizational_history: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  staff_bio: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  board_member_bio: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  outcome_metric: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  partnership_description: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  other: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

interface ContentTypeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function ContentTypeFilter({ value, onChange }: ContentTypeFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="All Types" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Types</SelectItem>
        {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
          <SelectItem key={key} value={key}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
