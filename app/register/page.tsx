"use client";

import { useState, useEffect } from "react";
import { addMember, memberExistsByContact } from "@/lib/members";
import { getTrainers, submitPTRequest, ptRequestExistsForTrainer } from "@/lib/trainers";
import { MemberPlan, MemberGender, Trainer, PLAN_LABELS } from "@/lib/types";
import { Dumbbell, CheckCircle, Loader2, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";

const plans: MemberPlan[] = ["monthly", "quarterly", "half-yearly", "yearly", "custom"];
const genders: { value: MemberGender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

// ── Validation helpers ───────────────────────────────────────────────────────

const PHONE_RE = /^[+\d][\d\s\-]{6,17}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_KEY_MEMBER = "gymtrack_last_register_member";
const RATE_LIMIT_KEY_PT = "gymtrack_last_register_pt";
const RATE_LIMIT_MS = 60_000;

function extractDigits(s: string) { return s.replace(/\D/g, ""); }

function validatePhone(phone: string): string | null {
  if (!phone.trim()) return "Phone number is required.";
  if (!PHONE_RE.test(phone.trim())) return "Enter a valid phone number (digits, spaces, +, - only).";
  const digits = extractDigits(phone);
  if (digits.length < 7 || digits.length > 15) return "Phone must have 7–15 digits.";
  return null;
}

function validateName(name: string): string | null {
  if (!name.trim()) return "Name is required.";
  if (name.trim().length > 80) return "Name must be 80 characters or fewer.";
  return null;
}

function checkRateLimit(key: string): string | null {
  try {
    const last = localStorage.getItem(key);
    if (last && Date.now() - Number(last) < RATE_LIMIT_MS) {
      return "You recently submitted a registration. Please wait before submitting again.";
    }
  } catch { /* localStorage unavailable — skip */ }
  return null;
}

function setRateLimitStamp(key: string) {
  try { localStorage.setItem(key, String(Date.now())); } catch { /* skip */ }
}

export default function RegisterPage() {
  const [activeTab, setActiveTab] = useState<"member" | "pt">("member");

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
        <div className="flex flex-col items-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center mb-3">
            <Dumbbell className="w-6 h-6 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-zinc-50">Hybrid Fitness</h1>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-4 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {(["member", "pt"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-sm font-medium transition-all",
                activeTab === tab
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {tab === "member" ? "Member Registration" : "PT Registration"}
            </button>
          ))}
        </div>

        {activeTab === "member" && <MemberTab onSwitchToPT={() => setActiveTab("pt")} />}
        {activeTab === "pt" && <PTTab />}
      </div>
    </div>
  );
}

// ── Member Registration Tab ───────────────────────────────────────────────────

function MemberTab({ onSwitchToPT }: { onSwitchToPT: () => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "" as MemberGender | "",
    plan: "" as MemberPlan | "",
    customDays: "",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [wantsPT, setWantsPT] = useState(false);

  // Minor consent state
  const [consentScrolled, setConsentScrolled] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [consent, setConsentFields] = useState({
    parentName: "",
    relationship: "",
    parentPhone: "",
    emergencyPhone: "",
    medicalConditions: "",
  });

  const age = Number(form.age);
  const isMinor = form.age !== "" && !isNaN(age) && age <= 15;

  // Reset consent when age changes
  useEffect(() => {
    setConsentScrolled(false);
    setConsentAgreed(false);
  }, [form.age]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setC = (field: string, value: string) =>
    setConsentFields((prev) => ({ ...prev, [field]: value }));

  const consentFieldsFilled =
    consent.parentName.trim() !== "" &&
    consent.relationship.trim() !== "" &&
    consent.parentPhone.trim() !== "" &&
    consent.emergencyPhone.trim() !== "";

  const canSubmit =
    agreed &&
    !submitting &&
    (!isMinor || (consentScrolled && consentAgreed && consentFieldsFilled));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Validation ──
    const nameErr = validateName(form.name);
    if (nameErr) { setError(nameErr); return; }

    const phoneErr = validatePhone(form.phone);
    if (phoneErr) { setError(phoneErr); return; }

    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) {
      setError("Enter a valid email address."); return;
    }

    if (form.age !== "" && (isNaN(age) || age < 1 || age > 100)) {
      setError("Age must be between 1 and 100."); return;
    }

    if (!form.gender || !form.plan) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.plan === "custom" && (!form.customDays || Number(form.customDays) < 1)) {
      setError("Please enter a valid number of days.");
      return;
    }

    if (isMinor) {
      const parentNameErr = validateName(consent.parentName);
      if (parentNameErr) { setError("Parent name: " + parentNameErr); return; }

      const parentPhoneErr = validatePhone(consent.parentPhone);
      if (parentPhoneErr) { setError("Parent phone: " + parentPhoneErr); return; }

      const emergencyPhoneErr = validatePhone(consent.emergencyPhone);
      if (emergencyPhoneErr) { setError("Emergency phone: " + emergencyPhoneErr); return; }
    }

    // ── Rate limit ──
    const rateErr = checkRateLimit(RATE_LIMIT_KEY_MEMBER);
    if (rateErr) { setError(rateErr); return; }

    setError("");
    setSubmitting(true);
    try {
      const exists = await memberExistsByContact(form.phone.trim(), form.email.trim());
      if (exists) {
        setError(
          "An account with this phone/email already exists. To register for PT, switch to the PT tab."
        );
        setSubmitting(false);
        return;
      }

      await addMember({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        gender: form.gender as MemberGender,
        plan: form.plan as MemberPlan,
        ...(form.plan === "custom" ? { customDays: Number(form.customDays) } : {}),
        startDate: form.startDate,
        ...(form.age !== "" ? { age } : {}),
        ...(isMinor
          ? {
              minorConsent: {
                parentName: consent.parentName.trim(),
                relationship: consent.relationship.trim(),
                parentPhone: consent.parentPhone.trim(),
                emergencyPhone: consent.emergencyPhone.trim(),
                medicalConditions: consent.medicalConditions.trim(),
                acknowledgedAt: new Date().toISOString().split("T")[0],
              },
            }
          : {}),
      });

      setRateLimitStamp(RATE_LIMIT_KEY_MEMBER);

      if (wantsPT) {
        onSwitchToPT();
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-xl font-bold text-zinc-50 mb-2">Registration Submitted!</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Your membership request has been received. The gym owner will review and activate your membership shortly.
          </p>
        </div>

        <a
          href="/rules.pdf"
          download="Hybrid Fitness Rules.pdf"
          className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-blue-600/50 text-zinc-300 hover:text-blue-400 text-sm font-medium rounded-xl px-4 py-3 transition-colors mb-4"
        >
          <FileDown className="w-4 h-4" />
          Download Gym Rules (PDF)
        </a>

        <div className="glass rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Hybrid Fitness: Official Gym Policies</h2>
          </div>
          <div className="overflow-y-auto max-h-[55vh] px-5 py-4 space-y-5">
            <RuleSection title="Equipment &amp; Facility Policies" rules={[
              ["Cardio Equipment Usage", "Cardio equipment (Treadmills, Cross-trainers, and Cycles) usage is restricted to a maximum of 15 minutes per session."],
              ["Daily Time Limit", "The maximum allowed time per member, per day, is 100 minutes."],
              ["Hogging Prohibited", "Do not hog any equipment, including weight stations or cardio machines."],
              ["Weight Re-racking", "Members must re-rack all weights and return equipment to its proper storage place after use."],
              ["Cleanliness", "Maintain proper hygiene. Do not leave your sweat behind on benches, mats, or equipment."],
              ["Reporting Damage", "Immediately report any damaged or malfunctioning equipment to management for prompt repair."],
            ]} />
            <div className="border-t border-zinc-800" />
            <RuleSection title="Conduct &amp; Etiquette" rules={[
              ["Mutual Respect", "All trainers must be treated with the utmost respect."],
              ["Professional Conduct", "Misbehaviour towards trainers will not be tolerated. Management holds full authority to terminate memberships if any complaint of misbehaviour is registered."],
              ["Positive Atmosphere", "Never laugh at beginners. Leave your ego at the door."],
              ["Member Space", "Always respect other members' personal space."],
              ["Interruption Policy", "Do not interrupt another member mid-set."],
              ["Phone Usage", "Mobile phones are not allowed on the workout floor during sessions, with exceptions for urgent calls only."],
            ]} />
            <div className="border-t border-zinc-800" />
            <RuleSection title="Access &amp; Appearance" rules={[
              ["Gym Attire", "Proper athletic attire (gym ware) and clean, dedicated indoor athletic shoes are mandatory on the workout floor. No formal wear is permitted."],
              ["Outside Footwear", "For the cleanliness and maintenance of the facility, outside shoes are strictly prohibited on the workout floor."],
              ["Children", "Children are not allowed with clients on the workout floor."],
              ["Guest Access", "Non-members accompanying members are not allowed on the workout floor."],
            ]} />
            <div className="border-t border-zinc-800" />
            <RuleSection title="Membership &amp; Missed Sessions" rules={[
              ["Non-Refundable", "Missed days, weeks, or months due to personal reasons will not be compensated, extended, or refunded."],
              ["Membership Restrictions", "Memberships cannot be frozen, paused, or transferred for any reason."],
              ["Defined Periods", "The membership period begins and ends as stated at the time of registration. All members are encouraged to plan their training schedules accordingly."],
            ]} />
            <div className="border-t border-zinc-800" />
            <p className="text-xs text-zinc-500 italic leading-relaxed">
              Our trainers are responsible for ensuring that the above policies are strictly enforced. Thank you for making Hybrid Fitness a place of discipline and commitment.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-4">Hybrid Fitness</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 border border-zinc-800">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full Name</label>
          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
            placeholder="Your full name" required
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Email <span className="text-zinc-600 font-normal">(optional)</span>
          </label>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
            placeholder="you@email.com"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Phone Number</label>
          <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
            placeholder="+91 98765 43210" required
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
        </div>

        {/* Age */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Age</label>
          <input type="number" value={form.age} onChange={(e) => set("age", e.target.value)}
            min="1" max="100" placeholder="e.g. 25"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Gender</label>
          <div className="grid grid-cols-2 gap-2">
            {genders.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => set("gender", value)}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  form.gender === value
                    ? "bg-blue-600/15 border-blue-600/50 text-blue-400"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}>
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
              <button key={plan} type="button" onClick={() => set("plan", plan)}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  form.plan === plan
                    ? "bg-blue-600/15 border-blue-600/50 text-blue-400"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}>
                {PLAN_LABELS[plan]}
              </button>
            ))}
          </div>
        </div>

        {/* Custom days */}
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
          <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} required
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors [color-scheme:dark]" />
        </div>

        {/* Minor consent section */}
        {isMinor && (
          <div className="rounded-xl border border-amber-600/30 bg-amber-500/5 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-amber-600/20">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Parental Consent Required</p>
              <p className="text-xs text-zinc-500 mt-0.5">Please scroll to the bottom and fill in all details</p>
            </div>

            {/* Scrollable consent card */}
            <div
              className="overflow-y-auto max-h-[60vh] px-4 py-3 space-y-3 text-xs text-zinc-400"
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
                  setConsentScrolled(true);
                }
              }}
            >
              {/* Legal text */}
              <p className="text-sm font-bold text-zinc-100 uppercase tracking-wider text-center">
                Parental Consent &amp; Liability Waiver for Minors
              </p>
              <p className="text-center text-zinc-500">HYBRID FITNESS – INDIA</p>

              <ConsentSection title="1. Consent">
                <p className="text-zinc-400 leading-relaxed">
                  The undersigned parent/legal guardian is granting permission for the minor child to participate in gym/fitness activities and utilise professional equipment at <span className="text-zinc-200 font-medium">Hybrid Fitness</span>.
                </p>
              </ConsentSection>

              <ConsentSection title="2. Risk Acknowledgment">
                <p className="text-zinc-400 leading-relaxed">
                  Physical exercise and gym activities involve inherent risks of injury, including but not limited to strains, sprains, falls, or other physical harm. The parent/guardian voluntarily accepts and assumes these risks on behalf of the child.
                </p>
              </ConsentSection>

              <ConsentSection title="3. Medical Declaration">
                <p className="text-zinc-400 leading-relaxed">
                  The child is confirmed medically fit with no underlying conditions restricting physical activity, unless declared below.
                </p>
              </ConsentSection>

              <ConsentSection title="4. Liability Waiver">
                <p className="text-zinc-400 leading-relaxed">
                  The parent/guardian agrees that Hybrid Fitness, its owners, trainers, and staff shall not be held liable for any injury, disability, or loss arising from participation or presence on the premises, except in cases of proven gross negligence.
                </p>
              </ConsentSection>

              <ConsentSection title="5. Emergency Consent">
                <p className="text-zinc-400 leading-relaxed">
                  Hybrid Fitness is authorised to provide or arrange necessary medical treatment in the event of an emergency. The parent/guardian agrees to bear all related medical and transportation expenses.
                </p>
              </ConsentSection>

              {/* Fillable fields — at bottom of scroll */}
              <div className="border-t border-zinc-700 pt-3 space-y-3">
                <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Parent / Guardian Details</p>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={consent.parentName} onChange={(e) => setC("parentName", e.target.value)}
                    placeholder="Parent/guardian full name" required
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 transition-colors" />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Relationship to Minor <span className="text-red-500">*</span></label>
                  <input type="text" value={consent.relationship} onChange={(e) => setC("relationship", e.target.value)}
                    placeholder="e.g. Mother, Father, Guardian" required
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 transition-colors" />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Primary Contact Number <span className="text-red-500">*</span></label>
                  <input type="tel" value={consent.parentPhone} onChange={(e) => setC("parentPhone", e.target.value)}
                    placeholder="+91 98765 43210" required
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 transition-colors" />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Emergency Contact Number <span className="text-red-500">*</span></label>
                  <input type="tel" value={consent.emergencyPhone} onChange={(e) => setC("emergencyPhone", e.target.value)}
                    placeholder="+91 98765 43210" required
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 transition-colors" />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Known Medical Conditions / Allergies</label>
                  <textarea value={consent.medicalConditions} onChange={(e) => setC("medicalConditions", e.target.value)}
                    placeholder="Leave blank if none" rows={2}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 transition-colors resize-none" />
                </div>

                {/* Consent checkbox */}
                <label className={cn(
                  "flex items-start gap-3 cursor-pointer group",
                  !consentScrolled && "opacity-50 pointer-events-none"
                )}>
                  <input type="checkbox" checked={consentAgreed} onChange={(e) => setConsentAgreed(e.target.checked)}
                    disabled={!consentScrolled}
                    className="mt-0.5 w-4 h-4 shrink-0 rounded border border-zinc-700 bg-zinc-900 accent-amber-500 cursor-pointer" />
                  <span className="text-xs text-zinc-400 leading-relaxed">
                    I, the parent/legal guardian named above, have read, understood, and voluntarily agree to the terms of this Parental Consent &amp; Liability Waiver
                  </span>
                </label>
                {!consentScrolled && (
                  <p className="text-xs text-zinc-600 italic">Scroll to the bottom to enable this checkbox</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rules acknowledgement */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 shrink-0 rounded border border-zinc-700 bg-zinc-900 accent-blue-600 cursor-pointer" />
          <span className="text-xs text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
            I have read and agree to the{" "}
            <a href="/rules.pdf" download="Hybrid Fitness Rules.pdf"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
              Hybrid Fitness gym rules
            </a>
          </span>
        </label>

        {/* PT opt-in */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" checked={wantsPT} onChange={(e) => setWantsPT(e.target.checked)}
            className="mt-0.5 w-4 h-4 shrink-0 rounded border border-zinc-700 bg-zinc-900 accent-blue-600 cursor-pointer" />
          <span className="text-xs text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
            I also want to register for a Personal Trainer
          </span>
        </label>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button type="submit" disabled={!canSubmit}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2">
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
          ) : (
            "Submit Registration"
          )}
        </button>
      </form>
    </div>
  );
}

// ── PT Registration Tab ───────────────────────────────────────────────────────

function PTTab() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [form, setForm] = useState({ memberName: "", memberPhone: "", trainerId: "" });
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

    const rateErr = checkRateLimit(RATE_LIMIT_KEY_PT);
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
      setRateLimitStamp(RATE_LIMIT_KEY_PT);
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-zinc-50 mb-2">Request Submitted!</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Your PT request has been received. The gym owner will review and confirm your trainer assignment shortly.
          </p>
        </div>

        <a
          href="/rules.pdf"
          download="Hybrid Fitness Rules.pdf"
          className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-blue-600/50 text-zinc-300 hover:text-blue-400 text-sm font-medium rounded-xl px-4 py-3 transition-colors mb-4"
        >
          <FileDown className="w-4 h-4" />
          Download Gym Rules (PDF)
        </a>

        <div className="glass rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Hybrid Fitness: Official Gym Policies</h2>
          </div>
          <div className="overflow-y-auto max-h-[55vh] px-5 py-4 space-y-5">
            <RuleSection title="Equipment &amp; Facility Policies" rules={[
              ["Cardio Equipment Usage", "Cardio equipment (Treadmills, Cross-trainers, and Cycles) usage is restricted to a maximum of 15 minutes per session."],
              ["Daily Time Limit", "The maximum allowed time per member, per day, is 100 minutes."],
              ["Hogging Prohibited", "Do not hog any equipment, including weight stations or cardio machines."],
              ["Weight Re-racking", "Members must re-rack all weights and return equipment to its proper storage place after use."],
              ["Cleanliness", "Maintain proper hygiene. Do not leave your sweat behind on benches, mats, or equipment."],
              ["Reporting Damage", "Immediately report any damaged or malfunctioning equipment to management for prompt repair."],
            ]} />
            <div className="border-t border-zinc-800" />
            <RuleSection title="Conduct &amp; Etiquette" rules={[
              ["Mutual Respect", "All trainers must be treated with the utmost respect."],
              ["Professional Conduct", "Misbehaviour towards trainers will not be tolerated. Management holds full authority to terminate memberships if any complaint of misbehaviour is registered."],
              ["Positive Atmosphere", "Never laugh at beginners. Leave your ego at the door."],
              ["Member Space", "Always respect other members' personal space."],
              ["Interruption Policy", "Do not interrupt another member mid-set."],
              ["Phone Usage", "Mobile phones are not allowed on the workout floor during sessions, with exceptions for urgent calls only."],
            ]} />
            <div className="border-t border-zinc-800" />
            <RuleSection title="Access &amp; Appearance" rules={[
              ["Gym Attire", "Proper athletic attire (gym ware) and clean, dedicated indoor athletic shoes are mandatory on the workout floor. No formal wear is permitted."],
              ["Outside Footwear", "For the cleanliness and maintenance of the facility, outside shoes are strictly prohibited on the workout floor."],
              ["Children", "Children are not allowed with clients on the workout floor."],
              ["Guest Access", "Non-members accompanying members are not allowed on the workout floor."],
            ]} />
            <div className="border-t border-zinc-800" />
            <RuleSection title="Membership &amp; Missed Sessions" rules={[
              ["Non-Refundable", "Missed days, weeks, or months due to personal reasons will not be compensated, extended, or refunded."],
              ["Membership Restrictions", "Memberships cannot be frozen, paused, or transferred for any reason."],
              ["Defined Periods", "The membership period begins and ends as stated at the time of registration. All members are encouraged to plan their training schedules accordingly."],
            ]} />
            <div className="border-t border-zinc-800" />
            <p className="text-xs text-zinc-500 italic leading-relaxed">
              Our trainers are responsible for ensuring that the above policies are strictly enforced. Thank you for making Hybrid Fitness a place of discipline and commitment.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-4">Hybrid Fitness</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 border border-zinc-800">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full Name</label>
          <input type="text" value={form.memberName} onChange={(e) => set("memberName", e.target.value)}
            placeholder="Your full name" required
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Phone Number</label>
          <input type="tel" value={form.memberPhone} onChange={(e) => set("memberPhone", e.target.value)}
            placeholder="+91 98765 43210" required
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Select Trainer</label>
          {trainers.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-zinc-600 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading trainers...
            </div>
          ) : (
            <div className="space-y-2">
              {trainers.map((t) => (
                <button key={t.id} type="button" onClick={() => set("trainerId", t.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    form.trainerId === t.id
                      ? "bg-blue-600/15 border-blue-600/50 text-blue-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                  }`}>
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

        <button type="submit" disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2">
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
          ) : (
            "Submit Request"
          )}
        </button>
      </form>
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function RuleSection({ title, rules }: { title: string; rules: string[][] }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-3"
        dangerouslySetInnerHTML={{ __html: title }} />
      <ol className="space-y-2.5">
        {rules.map(([ruleTitle, body], i) => (
          <li key={i} className="flex gap-2.5">
            <span className="text-blue-500 text-xs font-bold mt-0.5 shrink-0">{i + 1}.</span>
            <p className="text-xs text-zinc-400 leading-relaxed">
              <span className="text-blue-400 font-semibold">{ruleTitle}: </span>{body}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ConsentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-zinc-300 border-b border-zinc-700 pb-1">{title}</p>
      {children}
    </div>
  );
}
