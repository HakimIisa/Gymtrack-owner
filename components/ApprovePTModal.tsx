"use client";

import { useState } from "react";
import { approvePTRequest } from "@/lib/trainers";
import { PTRequest } from "@/lib/types";
import { X, Loader2 } from "lucide-react";

interface Props {
  request: PTRequest;
  defaultAmount?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApprovePTModal({ request, defaultAmount, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) { setError("Enter a valid amount."); return; }
    setError("");
    setSubmitting(true);
    try {
      await approvePTRequest(request.id, amountNum);
      onSuccess();
    } catch {
      setError("Failed to approve. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Approve PT Request</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{request.memberName}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mb-4 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Member</span>
            <span className="text-zinc-200">{request.memberName}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Phone</span>
            <span className="text-zinc-200">{request.memberPhone}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Trainer</span>
            <span className="text-zinc-200">{request.trainerName}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Duration</span>
            <span className="text-zinc-200">1 month (auto-unassigns)</span>
          </div>
        </div>

        <form onSubmit={handleApprove} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Amount Charged (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              placeholder="e.g. 3000"
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Approving...</> : "Confirm & Approve"}
          </button>
        </form>
      </div>
    </div>
  );
}
