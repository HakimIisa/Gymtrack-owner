"use client";

import { useState, useEffect } from "react";
import { getTrainers, submitPTRequest, ptRequestExistsForTrainer } from "@/lib/trainers";
import { Trainer } from "@/lib/types";
import { Dumbbell, CheckCircle, Loader2 } from "lucide-react";

const PHONE_RE = /^[+\d][\d\s\-]{6,17}$/;
const RATE_LIMIT_KEY_PT = "gymtrack_last_register_pt";
const RATE_LIMIT_MS = 60_000;

function extractDigits(s: string) { return s.replace(/\D/g, ""); }

function validatePhone(phone: string): string | null {
  if (!phone.trim()) return "Phone number is required.";
  if (!PHONE_RE.test(phone.trim())) return "Enter a valid phone number.";
  const digits = extractDigits(phone);
  if (digits.length < 7 || digits.length > 15) return "Phone must have 7–15 digits.";
  return null;
}

function validateName(name: string): string | null {
  if (!name.trim()) return "Name is required.";
  if (name.trim().length > 80) return "Name must be 80 characters or fewer.";
  return null;
}

function checkRateLimit(): string | null {
  try {
    const last = localStorage.getItem(RATE_LIMIT_KEY_PT);
    if (last && Date.now() - Number(last) < RATE_LIMIT_MS)
      return "You recently submitted a registration. Please wait before submitting again.";
  } catch { /* skip */ }
  return null;
}

function setRateLimitStamp() {
  try { localStorage.setItem(RATE_LIMIT_KEY_PT, String(Date.now())); } catch { /* skip */ }
}

export default function PTRegisterPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [form, setForm] = useState({
    memberName: "",
    memberPhone: "",
    trainerId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getTrainers().then(setTrainers);
  }, []);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameErr = validateName(form.memberName);
    if (nameErr) { setError(nameErr); return; }

    const phoneErr = validatePhone(form.memberPhone);
    if (phoneErr) { setError(phoneErr); return; }

    if (!form.trainerId) { setError("Please select a trainer."); return; }

    const rateErr = checkRateLimit();
    if (rateErr) { setError(rateErr); return; }

    setError("");
    setSubmitting(true);
    try {
      const dup = await ptRequestExistsForTrainer(form.memberPhone.trim(), form.trainerId);
      if (dup) {
        setError("You already have an active or pending PT request with this trainer.");
        setSubmitting(false);
        return;
      }
      const trainer = trainers.find((t) => t.id === form.trainerId)!;
      await submitPTRequest({
        memberId: "",
        memberName: form.memberName.trim(),
        memberPhone: form.memberPhone.trim(),
        trainerId: trainer.id,
        trainerName: trainer.name,
      });
      setRateLimitStamp();
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-xl font-bold text-zinc-50 mb-2">Request Submitted!</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Your PT request has been received. The gym owner will review and confirm your trainer assignment shortly.
          </p>
          <p className="text-xs text-zinc-600 mt-6">Hybrid Fitness</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center mb-3">
            <Dumbbell className="w-6 h-6 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-zinc-50">Hybrid Fitness</h1>
          <p className="text-sm text-zinc-500 mt-1">Personal Trainer Request</p>
        </div>

        <div className="glass rounded-2xl p-6 border border-zinc-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.memberName}
                onChange={(e) => set("memberName", e.target.value)}
                placeholder="Your full name"
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={form.memberPhone}
                onChange={(e) => set("memberPhone", e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Select Trainer</label>
              {trainers.length === 0 ? (
                <p className="text-xs text-zinc-600 py-2">Loading trainers...</p>
              ) : (
                <div className="space-y-2">
                  {trainers.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => set("trainerId", t.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                        form.trainerId === t.id
                          ? "bg-blue-600/15 border-blue-600/50 text-blue-400"
                          : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                      }`}
                    >
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{t.specialization}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                "Submit Request"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-4">
          Your information is securely stored.
        </p>
      </div>
    </div>
  );
}
