"use client";

import { useEffect, useState, useCallback } from "react";
import { getTrainers, deleteTrainer, getPTRequests, unassignPT } from "@/lib/trainers";
import { Trainer, PTRequest } from "@/lib/types";
import AddTrainerModal from "@/components/AddTrainerModal";
import ApprovePTModal from "@/components/ApprovePTModal";
import AssignPTModal from "@/components/AssignPTModal";
import { UserPlus, Pencil, Trash2, Loader2, QrCode, ChevronDown, ChevronUp, UserCheck, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [ptRequests, setPTRequests] = useState<PTRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [editTarget, setEditTarget] = useState<Trainer | null>(null);
  const [approveTarget, setApproveTarget] = useState<PTRequest | null>(null);
  const [expandedTrainer, setExpandedTrainer] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [t, r] = await Promise.all([getTrainers(), getPTRequests()]);
    setTrainers(t);
    setPTRequests(r);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (trainer: Trainer) => {
    if (!confirm(`Remove ${trainer.name}? This cannot be undone.`)) return;
    await deleteTrainer(trainer.id);
    load();
  };

  const ptRegisterUrl = typeof window !== "undefined"
    ? `${window.location.origin}/pt-register`
    : "/pt-register";

  const pendingRequests = ptRequests.filter((r) => r.status === "pending");

  const activeAssignments = (trainerId: string) =>
    ptRequests.filter((r) => r.trainerId === trainerId && r.status === "active");

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Trainers</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{trainers.length} trainer{trainers.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQR(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 text-sm transition-colors"
          >
            <QrCode className="w-4 h-4" />
            PT Registration QR
          </button>
          <button
            onClick={() => setShowAssign(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 text-sm transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            Assign PT
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Trainer
          </button>
        </div>
      </div>

      {/* Pending PT Requests */}
      {!loading && pendingRequests.length > 0 && (
        <div className="glass border border-amber-500/20 rounded-2xl p-4 mb-5">
          <p className="text-sm font-medium text-amber-400 mb-3">
            {pendingRequests.length} pending PT request{pendingRequests.length > 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between bg-zinc-900/60 rounded-xl px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-zinc-100">{req.memberName}</p>
                  <p className="text-xs text-zinc-500">{req.memberPhone} → {req.trainerName}</p>
                </div>
                <button
                  onClick={() => setApproveTarget(req)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/15 border border-blue-600/30 text-blue-400 text-xs font-medium hover:bg-blue-600/25 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trainers Table */}
      <div className="glass border border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        ) : trainers.length === 0 ? (
          <div className="text-center py-16 text-zinc-600 text-sm">
            No trainers yet. Add one to get started.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Trainer</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden sm:table-cell">Specialization</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden md:table-cell">Rate</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Members</th>
                <th className="text-right text-xs font-medium text-zinc-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trainers.map((trainer, i) => {
                const active = activeAssignments(trainer.id);
                const isExpanded = expandedTrainer === trainer.id;
                return (
                  <>
                    <tr
                      key={trainer.id}
                      className={cn(
                        "border-b border-zinc-800/60 hover:bg-zinc-800/20 transition-colors",
                        isExpanded ? "border-b-0" : i === trainers.length - 1 && "border-b-0"
                      )}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-zinc-100">{trainer.name}</p>
                        <p className="text-xs text-zinc-500">{trainer.phone}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-zinc-400">{trainer.specialization}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-zinc-400">₹{trainer.monthlyRate.toLocaleString()}/mo</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedTrainer(isExpanded ? null : trainer.id)}
                          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                          <span className="font-medium">{active.length}</span> active
                          {active.length > 0 && (
                            isExpanded
                              ? <ChevronUp className="w-3 h-3" />
                              : <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditTarget(trainer)}
                            title="Edit trainer"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(trainer)}
                            title="Remove trainer"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded assignments */}
                    {isExpanded && active.length > 0 && (
                      <tr key={`${trainer.id}-expanded`} className={cn("border-b border-zinc-800/60", i === trainers.length - 1 && "border-b-0")}>
                        <td colSpan={5} className="px-4 pb-3">
                          <div className="bg-zinc-900/50 rounded-xl overflow-hidden">
                            {active.map((req, ri) => (
                              <div
                                key={req.id}
                                className={cn(
                                  "flex items-center justify-between px-3 py-2.5 text-xs",
                                  ri < active.length - 1 && "border-b border-zinc-800/60"
                                )}
                              >
                                <div>
                                  <p className="text-zinc-200 font-medium">{req.memberName}</p>
                                  <p className="text-zinc-500">{req.memberPhone}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <p className="text-zinc-500">Expires: {req.expiryDate ?? "—"}</p>
                                  <button
                                    onClick={async () => {
                                      if (!confirm(`Unassign ${req.memberName} from ${trainer.name}?`)) return;
                                      await unassignPT(req.id);
                                      load();
                                    }}
                                    title="Unassign member"
                                    className="flex items-center gap-1 text-zinc-600 hover:text-red-400 transition-colors"
                                  >
                                    <UserMinus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <AddTrainerModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); load(); }} />
      )}
      {showAssign && (
        <AssignPTModal onClose={() => setShowAssign(false)} onSuccess={() => { setShowAssign(false); load(); }} />
      )}
      {editTarget && (
        <AddTrainerModal trainer={editTarget} onClose={() => setEditTarget(null)} onSuccess={() => { setEditTarget(null); load(); }} />
      )}
      {approveTarget && (
        <ApprovePTModal request={approveTarget} onClose={() => setApproveTarget(null)} onSuccess={() => { setApproveTarget(null); load(); }} />
      )}
      {showQR && (
        <PTQRModal url={ptRegisterUrl} onClose={() => setShowQR(false)} />
      )}
    </div>
  );
}

function PTQRModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass border border-zinc-800 rounded-2xl p-6 w-full max-w-xs text-center">
        <h2 className="text-base font-semibold text-zinc-100 mb-1">PT Registration QR</h2>
        <p className="text-xs text-zinc-500 mb-4">Members scan this to request a personal trainer</p>
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
