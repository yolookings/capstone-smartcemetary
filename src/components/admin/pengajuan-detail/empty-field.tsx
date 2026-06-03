import { HelpCircle } from "lucide-react";

interface EmptyFieldProps {
  label?: string;
}

export function EmptyField({ label }: EmptyFieldProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 text-xs font-medium border border-dashed border-slate-200">
      <HelpCircle size={12} />
      {label || "Tidak Ada Data"}
    </span>
  );
}
