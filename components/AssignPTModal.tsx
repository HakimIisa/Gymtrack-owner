"use client";

import { useState, useEffect } from "react";
import { getTrainers, directAssignPT, ptRequestExistsForTrainer } from "@/lib/trainers";
import { getMembers } from "@/lib/members";
import { Member, Trainer } from "@/lib/types";
import { X, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignPTModal({ onClose, onSuccess }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getMembers(), getTrainers()]).then(([m, t]) => {
      setMembers(m);
      setTrainers(t);
    });
  }, []);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) { setError("Select a member."); return; }
    if (!selectedTrainer) { setError("Select a trainer."); return; }
    setError("");
    setSubmitting(true);
    try {
      const dup = await ptRequestExistsForTrainer(selectedMember.phone, selectedTrainer.id);
      if (dup) {
        setError("This member already has an active or pending PT request with this trainer.");
        setSubmitting(false);
        return;
      }
      await directAssignPT(
        { id: selectedMember.id, name: selectedMember.name, phone: selectedMember.phone },
        { id: selectedTrainer.id, name: selectedTrainer.name }
      );
      onSuccess();
    } catch {
      setError("Failed to assign. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass border border-zinc-800 rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-100">Assign Personal Trainer</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member picker */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Member</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 transition-colors"
              />
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1">
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMember(m)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg border text-sm transition-all",
                    selectedMember?.id === m.id
                      ? "bg-blue-600/15 border-blue-600/50 text-blue-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                  )}
                >
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-zinc-500">{m.phone}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Trainer picker */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Trainer</label>
            <div className="space-y-1">
              {trainers.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTrainer(t)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg border text-sm transition-all",
                    selectedTrainer?.id === t.id
                      ? "bg-blue-600/15 border-blue-600/50 text-blue-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                  )}
                >
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.specialization} · ₹{t.monthlyRate.toLocaleString()}/mo</p>
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
            This creates a pending request. Approve it from the Members tab to set the amount and activate.
          </p>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : "Submit PT Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
