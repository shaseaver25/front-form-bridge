import * as React from "react";
import { cn } from "@/lib/utils";

interface ListCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

export function ListCard({ children, onClick, selected, className }: ListCardProps) {
  return (
    <div
      role="article"
      onClick={onClick}
      className={cn(
        "group relative rounded-lg border bg-card p-6 shadow-sm transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        onClick && "cursor-pointer",
        selected && "border-l-4 border-l-primary",
        className
      )}
    >
      {children}
    </div>
  );
}