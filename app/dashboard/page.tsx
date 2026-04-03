"use client";

import { useEffect, useState } from "react";
import { getMembers } from "@/lib/members";
import { getPendingPTRequests } from "@/lib/trainers";
import { Member } from "@/lib/types";
import { Users, UserCheck, AlertTriangle, TrendingUp, Clock, UserX, UserPlus, Loader2, Dumbbell } from "lucide-react";

export default function DashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingPTCount, setPendingPTCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMembers(), getPendingPTRequests()]).then(([m, pt]) => {
      setMembers(m);
      setPendingPTCount(pt.length);
      setLoading(false);
    });
  }, []);

  const total = members.length;
  const active = members.filter((m) => m.status === "active").length;
  const pending = members.filter((m) => m.status === "pending").length;
  const overdue = members.filter((m) => m.status === "overdue").length;
  const expired = members.filter((m) => m.status === "expired").length;

  const thisMonth = new Date().toISOString().slice(0, 7);
  const newThisMonth = members.filter((m) => m.createdAt?.startsWith(thisMonth)).length;

  // Expiring within 7 days
  const expiringSoon = members.filter((m) => {
    if (m.status !== "active" || !m.expiryDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(m.expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diff = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 7;
  }).length;

  const primaryStats = [
    { label: "Total Members", value: total, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Active", value: active, icon: UserCheck, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Pending Approval", value: pending, icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Expiring Soon (7 days)", value: expiringSoon, icon: Clock, color: "text-purple-400", bg: "bg-purple-500/10" },
  ];

  // Secondary row — easy to remove if reverting to 4-card layout
  const secondaryStats = [
    { label: "Payment Overdue", value: overdue, icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Expired", value: expired, icon: UserX, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "New This Month", value: newThisMonth, icon: UserPlus, color: "text-sky-400", bg: "bg-sky-500/10" },
    { label: "PT Requests", value: pendingPTCount, icon: Dumbbell, color: "text-violet-400", bg: "bg-violet-500/10" },
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
        <>
          {/* Primary row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {primaryStats.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="glass rounded-2xl p-4 border border-zinc-800">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-xs text-zinc-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-zinc-100">{value}</p>
              </div>
            ))}
          </div>

          {/* Secondary row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {secondaryStats.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="glass rounded-2xl p-4 border border-zinc-800">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-xs text-zinc-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-zinc-100">{value}</p>
              </div>
            ))}
          </div>
        </>
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
