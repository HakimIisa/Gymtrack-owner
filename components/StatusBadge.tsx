import { MemberStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const config: Record<MemberStatus, { label: string; classes: string; dot: string }> = {
  active:  { label: "Active",          classes: "bg-green-500/10 text-green-400 border-green-500/20",   dot: "bg-green-400" },
  pending: { label: "Pending",         classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",   dot: "bg-amber-400" },
  overdue: { label: "Payment Overdue", classes: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-400" },
  expired: { label: "Expired",         classes: "bg-red-500/10 text-red-400 border-red-500/20",         dot: "bg-red-400" },
};

export default function StatusBadge({ status }: { status: MemberStatus }) {
  const { label, classes, dot } = config[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border", classes)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}
