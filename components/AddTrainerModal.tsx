"use client";

import { useState } from "react";
import { addTrainer, updateTrainer } from "@/lib/trainers";
import { Trainer } from "@/lib/types";
import { X, Loader2 } from "lucide-react";

interface Props {
  trainer?: Trainer; // if provided, edit mode
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTrainerModal({ trainer, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    name: trainer?.name ?? "",
    phone: trainer?.phone ?? "",
    specialization: trainer?.specialization ?? "",
    monthlyRate: trainer?.monthlyRate?.toString() ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = Number(form.monthlyRate);
    if (!rate || rate < 0) { setError("Enter a valid monthly rate."); return; }
    setError("");
    setSubmitting(true);
    try {
      if (trainer) {
        await updateTrainer(trainer.id, {
          name: form.name.trim(),
          phone: form.phone.trim(),
          specialization: form.specialization.trim(),
          monthlyRate: rate,
        });
      } else {
        await addTrainer({
          name: form.name.trim(),
          phone: form.phone.trim(),
          specialization: form.specialization.trim(),
          monthlyRate: rate,
        });
      }
      onSuccess();
    } catch {
      setError("Failed to save trainer. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-100">
            {trainer ? "Edit Trainer" : "Add Trainer"}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="Trainer name" required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Phone Number</label>
            <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 98765 43210" required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Specialization</label>
            <input type="text" value={form.specialization} onChange={(e) => set("specialization", e.target.value)}
              placeholder="e.g. Weight Training, Yoga" required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Monthly Rate (₹)</label>
            <input type="number" value={form.monthlyRate} onChange={(e) => set("monthlyRate", e.target.value)}
              min="0" placeholder="e.g. 3000" required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : trainer ? "Save Changes" : "Add Trainer"}
          </button>
        </form>
      </div>
    </div>
  );
}
