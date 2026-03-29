"use client";

import { useEffect, useState } from "react";
import { getMembers } from "@/lib/members";
import { Member } from "@/lib/types";
import { Users, UserCheck, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMembers().then((data) => { setMembers(data); setLoading(false); });
  }, []);

  const total = members.length;
  const active = members.filter((m) => m.status === "active").length;
  const pending = members.filter((m) => m.status === "pending").length;
  const overdue = members.filter((m) => m.status === "overdue").length;

  const stats = [
    { label: "Total Members", value: total, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Active", value: active, icon: UserCheck, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Pending Approval", value: pending, icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Payment Overdue", value: overdue, icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-50">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Hybrid Fitness — Owner Overview</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading stats...
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="glass rounded-2xl p-4 border border-zinc-800">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-xs text-zinc-500 mb-1">{label}</p>
              <p className="text-2xl font-bold text-zinc-100">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pending members quick view */}
      {!loading && pending > 0 && (
        <div className="glass border border-amber-500/20 rounded-2xl p-4">
          <p className="text-sm font-medium text-amber-400 mb-1">
            {pending} member{pending > 1 ? "s" : ""} awaiting approval
          </p>
          <p className="text-xs text-zinc-500">
            Go to Members → filter by Pending → record their payment to activate them.
          </p>
        </div>
      )}
    </div>
  );
}
