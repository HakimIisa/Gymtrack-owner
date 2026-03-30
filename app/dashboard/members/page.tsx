"use client";

import { useEffect, useState, useCallback } from "react";
import { getMembers, updateMember } from "@/lib/members";
import { Member, MemberStatus, PLAN_LABELS } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import AddMemberModal from "@/components/AddMemberModal";
import RecordPaymentModal from "@/components/RecordPaymentModal";
import { Search, UserPlus, IndianRupee, Trash2, Loader2, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

const statusFilters: { value: MemberStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "overdue", label: "Overdue" },
  { value: "expired", label: "Expired" },
];

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MemberStatus | "all">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<Member | null>(null);
  const [showQR, setShowQR] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getMembers();
    setMembers(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (member: Member) => {
    if (!confirm(`Remove ${member.name} from the system? This cannot be undone.`)) return;
    const { deleteDoc, doc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");
    await deleteDoc(doc(db, "members", member.id));
    load();
  };

  const registerUrl = typeof window !== "undefined"
    ? `${window.location.origin}/register`
    : "/register";

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Members</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{members.length} total members</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQR(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 text-sm transition-colors"
          >
            <QrCode className="w-4 h-4" />
            QR Code
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statusFilters.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                statusFilter === value
                  ? "bg-blue-600/15 border-blue-600/40 text-blue-400"
                  : "border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass border border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-600 text-sm">
            {search || statusFilter !== "all" ? "No members match your search." : "No members yet. Add one or share the QR code."}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Member</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden sm:table-cell">Plan</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden md:table-cell">Expiry</th>
                <th className="text-right text-xs font-medium text-zinc-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member, i) => (
                <tr
                  key={member.id}
                  className={cn(
                    "border-b border-zinc-800/60 hover:bg-zinc-800/20 transition-colors",
                    i === filtered.length - 1 && "border-b-0"
                  )}
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-zinc-100">{member.name}</p>
                    <p className="text-xs text-zinc-500">{member.phone}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-zinc-400 capitalize">{PLAN_LABELS[member.plan]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={member.status} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-zinc-500">
                      {member.expiryDate ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setPaymentTarget(member)}
                        title="Record Payment"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                      >
                        <IndianRupee className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(member)}
                        title="Remove member"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <AddMemberModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); load(); }}
        />
      )}
      {paymentTarget && (
        <RecordPaymentModal
          member={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSuccess={() => { setPaymentTarget(null); load(); }}
        />
      )}
      {showQR && (
        <QRModal url={registerUrl} onClose={() => setShowQR(false)} />
      )}
    </div>
  );
}

function QRModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass border border-zinc-800 rounded-2xl p-6 w-full max-w-xs text-center">
        <h2 className="text-base font-semibold text-zinc-100 mb-1">Member Registration QR</h2>
        <p className="text-xs text-zinc-500 mb-4">Members scan this to register online</p>
        <div className="bg-white rounded-xl p-3 inline-block mb-4">
          <QRCodeDisplay url={url} />
        </div>
        <p className="text-xs text-zinc-600 break-all">{url}</p>
        <button onClick={onClose} className="mt-4 w-full py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}

function QRCodeDisplay({ url }: { url: string }) {
  const [QRCode, setQRCode] = useState<React.ComponentType<{ value: string; size: number }> | null>(null);

  useEffect(() => {
    import("react-qrcode-logo").then((mod) => {
      setQRCode(() => mod.QRCode as React.ComponentType<{ value: string; size: number }>);
    });
  }, []);

  if (!QRCode) return <div className="w-[160px] h-[160px] bg-zinc-100 animate-pulse rounded" />;
  return <QRCode value={url} size={160} />;
}
