"use client";

import { useState } from "react";
import { addMember } from "@/lib/members";
import { MemberPlan, MemberGender, PLAN_LABELS } from "@/lib/types";
import { Dumbbell, CheckCircle, Loader2, FileDown } from "lucide-react";

const plans: MemberPlan[] = ["monthly", "quarterly", "half-yearly", "yearly", "custom"];
const genders: { value: MemberGender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "" as MemberGender | "",
    plan: "" as MemberPlan | "",
    customDays: "",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gender || !form.plan) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    if (form.plan === "custom" && (!form.customDays || Number(form.customDays) < 1)) {
      setError("Please enter a valid number of days.");
      return;
    }
    setSubmitting(true);
    try {
      await addMember({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        gender: form.gender as MemberGender,
        plan: form.plan as MemberPlan,
        ...(form.plan === "custom" ? { customDays: Number(form.customDays) } : {}),
        startDate: form.startDate,
      });
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
        <div className="w-full max-w-sm">
          {/* Success header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-xl font-bold text-zinc-50 mb-2">Registration Submitted!</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Your membership request has been received. The gym owner will review and activate your membership shortly.
            </p>
          </div>

          {/* Download button */}
          <a
            href="/rules.pdf"
            download="Hybrid Fitness Rules.pdf"
            className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-blue-600/50 text-zinc-300 hover:text-blue-400 text-sm font-medium rounded-xl px-4 py-3 transition-colors mb-4"
          >
            <FileDown className="w-4 h-4" />
            Download Gym Rules (PDF)
          </a>

          {/* Scrollable rules card */}
          <div className="glass rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Hybrid Fitness: Official Gym Policies</h2>
            </div>
            <div className="overflow-y-auto max-h-[55vh] px-5 py-4 space-y-5">
              {/* Equipment & Facility */}
              <div>
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-3">Equipment &amp; Facility Policies</h3>
                <ol className="space-y-2.5">
                  {[
                    ["Cardio Equipment Usage", "Cardio equipment (Treadmills, Cross-trainers, and Cycles) usage is restricted to a maximum of 15 minutes per session."],
                    ["Daily Time Limit", "The maximum allowed time per member, per day, is 100 minutes."],
                    ["Hogging Prohibited", "Do not hog any equipment, including weight stations or cardio machines."],
                    ["Weight Re-racking", "Members must re-rack all weights and return equipment to its proper storage place after use."],
                    ["Cleanliness", "Maintain proper hygiene. Do not leave your sweat behind on benches, mats, or equipment."],
                    ["Reporting Damage", "Immediately report any damaged or malfunctioning equipment to management for prompt repair."],
                  ].map(([title, body], i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="text-blue-500 text-xs font-bold mt-0.5 shrink-0">{i + 1}.</span>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        <span className="text-blue-400 font-semibold">{title}: </span>{body}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="border-t border-zinc-800" />

              {/* Conduct & Etiquette */}
              <div>
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-3">Conduct &amp; Etiquette</h3>
                <ol className="space-y-2.5">
                  {[
                    ["Mutual Respect", "All trainers must be treated with the utmost respect."],
                    ["Professional Conduct", "Misbehaviour towards trainers will not be tolerated. Management holds full authority to terminate memberships if any complaint of misbehaviour is registered."],
                    ["Positive Atmosphere", "Never laugh at beginners. Leave your ego at the door."],
                    ["Member Space", "Always respect other members' personal space."],
                    ["Interruption Policy", "Do not interrupt another member mid-set."],
                    ["Phone Usage", "Mobile phones are not allowed on the workout floor during sessions, with exceptions for urgent calls only."],
                  ].map(([title, body], i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="text-blue-500 text-xs font-bold mt-0.5 shrink-0">{i + 1}.</span>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        <span className="text-blue-400 font-semibold">{title}: </span>{body}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="border-t border-zinc-800" />

              {/* Access & Appearance */}
              <div>
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-3">Access &amp; Appearance</h3>
                <ol className="space-y-2.5">
                  {[
                    ["Gym Attire", "Proper athletic attire (gym ware) and clean, dedicated indoor athletic shoes are mandatory on the workout floor. No formal wear is permitted."],
                    ["Outside Footwear", "For the cleanliness and maintenance of the facility, outside shoes are strictly prohibited on the workout floor."],
                    ["Children", "Children are not allowed with clients on the workout floor."],
                    ["Guest Access", "Non-members accompanying members are not allowed on the workout floor."],
                  ].map(([title, body], i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="text-blue-500 text-xs font-bold mt-0.5 shrink-0">{i + 1}.</span>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        <span className="text-blue-400 font-semibold">{title}: </span>{body}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="border-t border-zinc-800" />

              {/* Membership & Missed Sessions */}
              <div>
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-3">Membership &amp; Missed Sessions</h3>
                <ol className="space-y-2.5">
                  {[
                    ["Non-Refundable", "Missed days, weeks, or months due to personal reasons will not be compensated, extended, or refunded."],
                    ["Membership Restrictions", "Memberships cannot be frozen, paused, or transferred for any reason."],
                    ["Defined Periods", "The membership period begins and ends as stated at the time of registration. All members are encouraged to plan their training schedules accordingly."],
                  ].map(([title, body], i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="text-blue-500 text-xs font-bold mt-0.5 shrink-0">{i + 1}.</span>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        <span className="text-blue-400 font-semibold">{title}: </span>{body}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="border-t border-zinc-800" />

              <p className="text-xs text-zinc-500 italic leading-relaxed">
                Our trainers are responsible for ensuring that the above policies are strictly enforced. Thank you for making Hybrid Fitness a place of discipline and commitment.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-zinc-600 mt-4">Hybrid Fitness</p>
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
        {/* Rules download banner */}
        <a
          href="/rules.pdf"
          download="Hybrid Fitness Rules.pdf"
          className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-blue-600/50 text-zinc-300 hover:text-blue-400 text-sm font-medium rounded-xl px-4 py-3 transition-colors mb-4"
        >
          <FileDown className="w-4 h-4" />
          Download Gym Rules (PDF)
        </a>

        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center mb-3">
            <Dumbbell className="w-6 h-6 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-zinc-50">Hybrid Fitness</h1>
          <p className="text-sm text-zinc-500 mt-1">New Member Registration</p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-6 border border-zinc-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Your full name"
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@email.com"
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {genders.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("gender", value)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      form.gender === value
                        ? "bg-blue-600/15 border-blue-600/50 text-blue-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Plan */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Membership Plan</label>
              <div className="grid grid-cols-2 gap-2">
                {plans.map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => set("plan", plan)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      form.plan === plan
                        ? "bg-blue-600/15 border-blue-600/50 text-blue-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {PLAN_LABELS[plan]}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom days — only shown when Custom is selected */}
            {form.plan === "custom" && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Number of Days</label>
                <input type="number" value={form.customDays} onChange={(e) => set("customDays", e.target.value)}
                  min="1" placeholder="e.g. 7" required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
                <p className="text-xs text-zinc-600 mt-1">The gym owner will confirm the price.</p>
              </div>
            )}

            {/* Start Date */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Preferred Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors [color-scheme:dark]"
              />
            </div>

            {/* Rules acknowledgement */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0 rounded border border-zinc-700 bg-zinc-900 accent-blue-600 cursor-pointer"
              />
              <span className="text-xs text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                I have read and agree to the{" "}
                <a
                  href="/rules.pdf"
                  download="Hybrid Fitness Rules.pdf"
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
                >
                  Hybrid Fitness gym rules
                </a>
              </span>
            </label>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !agreed}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Registration"
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
