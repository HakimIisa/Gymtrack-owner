"use client";

import { useState } from "react";
import { addMember } from "@/lib/members";
import { MemberPlan, MemberGender, PLAN_LABELS } from "@/lib/types";
import { X, Loader2 } from "lucide-react";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const plans: MemberPlan[] = ["monthly", "quarterly", "half-yearly", "yearly", "custom"];

export default function AddMemberModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "" as MemberGender | "",
    plan: "monthly" as MemberPlan,
    customDays: "",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gender) { setError("Please select a gender."); return; }
    if (form.plan === "custom" && (!form.customDays || Number(form.customDays) < 1)) {
      setError("Please enter a valid number of days."); return;
    }
    setError("");
    setSubmitting(true);
    try {
      await addMember({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        gender: form.gender as MemberGender,
        plan: form.plan,
        ...(form.plan === "custom" ? { customDays: Number(form.customDays) } : {}),
        startDate: form.startDate,
        ...(form.age !== "" ? { age: Number(form.age) } : {}),
      });
      onSuccess();
    } catch {
      setError("Failed to add member. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass border border-zinc-800 rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-100">Add Member</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="Member name" required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Email <span className="text-zinc-600 font-normal">(optional)</span>
            </label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
              placeholder="member@email.com"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Phone Number</label>
            <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 98765 43210" required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Age</label>
            <input type="number" value={form.age} onChange={(e) => set("age", e.target.value)}
              min="1" max="100" placeholder="e.g. 25"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Gender</label>
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as MemberGender[]).map((g) => (
                <button key={g} type="button" onClick={() => set("gender", g)}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-all capitalize ${
                    form.gender === g
                      ? "bg-blue-600/15 border-blue-600/50 text-blue-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Membership Plan</label>
            <div className="grid grid-cols-2 gap-2">
              {plans.map((p) => (
                <button key={p} type="button" onClick={() => set("plan", p)}
                  className={`py-2.5 rounded-lg text-xs font-medium border transition-all ${
                    form.plan === p
                      ? "bg-blue-600/15 border-blue-600/50 text-blue-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}>
                  {PLAN_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {form.plan === "custom" && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Number of Days</label>
              <input type="number" value={form.customDays} onChange={(e) => set("customDays", e.target.value)}
                min="1" placeholder="e.g. 7" required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
              <p className="text-xs text-zinc-600 mt-1">Price will be set when recording payment.</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Start Date</label>
            <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors [color-scheme:dark]" />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : "Add Member"}
          </button>
        </form>
      </div>
    </div>
  );
}
