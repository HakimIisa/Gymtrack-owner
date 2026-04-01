"use client";

import { useState, useEffect } from "react";
import { Member, MemberPlan, PLAN_LABELS, PricingConfig } from "@/lib/types";
import { recordPayment, getPricing, defaultPeriodStartDate } from "@/lib/members";
import { X, Loader2 } from "lucide-react";

interface Props {
  member: Member;
  onClose: () => void;
  onSuccess: () => void;
}

const plans: MemberPlan[] = ["monthly", "quarterly", "half-yearly", "yearly", "custom"];

export default function RecordPaymentModal({ member, onClose, onSuccess }: Props) {
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [plan, setPlan] = useState<MemberPlan>(member.plan);
  const [amount, setAmount] = useState<string>("");
  const [customDays, setCustomDays] = useState<string>(String(member.customDays ?? 7));
  const [periodStartDate, setPeriodStartDate] = useState<string>(
    defaultPeriodStartDate(member.status, member.expiryDate)
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPricing().then((p) => {
      setPricing(p);
      if (member.plan !== "custom") {
        setAmount(String(p[member.plan as Exclude<MemberPlan, "custom">][member.gender]));
      }
    });
  }, [member.plan, member.gender]);

  useEffect(() => {
    if (!pricing || plan === "custom") return;
    setAmount(String(pricing[plan as Exclude<MemberPlan, "custom">][member.gender]));
  }, [plan, pricing, member.gender]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) { setError("Please enter a valid amount."); return; }
    if (plan === "custom" && (!customDays || Number(customDays) < 1)) {
      setError("Please enter a valid number of days."); return;
    }
    setSubmitting(true);
    setError("");
    try {
      await recordPayment(
        member,
        plan,
        amountNum,
        periodStartDate,
        plan === "custom" ? Number(customDays) : undefined,
        note
      );
      onSuccess();
    } catch {
      setError("Failed to record payment. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass border border-zinc-800 rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Record Payment</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{member.name}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plan */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Plan</label>
            <div className="grid grid-cols-2 gap-2">
              {plans.map((p) => (
                <button key={p} type="button" onClick={() => setPlan(p)}
                  className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                    plan === p
                      ? "bg-blue-600/15 border-blue-600/50 text-blue-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}>
                  {PLAN_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Custom days — only shown when Custom is selected */}
          {plan === "custom" && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Number of Days</label>
              <input type="number" value={customDays} onChange={(e) => setCustomDays(e.target.value)}
                min="1" placeholder="e.g. 7"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Amount (₹)
              {plan !== "custom" && <span className="ml-1 text-zinc-600 font-normal">— edit to apply discount</span>}
            </label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              min="1" required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
          </div>

          {/* Membership start date */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Membership Period Starts
              <span className="ml-1 text-zinc-600 font-normal">— override if needed</span>
            </label>
            <input type="date" value={periodStartDate} onChange={(e) => setPeriodStartDate(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors [color-scheme:dark]" />
            <p className="text-xs text-zinc-600 mt-1">
              {member.status === "overdue"
                ? "Defaulting to original expiry date — member renews from where they left off."
                : "Defaulting to today — fresh start."}
            </p>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Note (optional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Discount applied"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={submitting || !pricing}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Recording...</> : "Confirm Payment"}
          </button>
        </form>
      </div>
    </div>
  );
}
