"use client";

import { useEffect, useState } from "react";
import { getPricing, savePricing } from "@/lib/members";
import { PricingConfig, PLAN_LABELS, MemberPlan } from "@/lib/types";
import { savePin, getStoredPin } from "@/components/PinLock";
import { verifyBeforeUpdateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Check, Loader2, KeyRound, DollarSign, ShieldCheck } from "lucide-react";

const plans: Exclude<MemberPlan, "custom">[] = ["monthly", "quarterly", "half-yearly", "yearly"];

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-zinc-50">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage pricing, PIN, and account</p>
      </div>
      <PricingSection />
      <PinSection />
      <AccountSection />
    </div>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────

function PricingSection() {
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { getPricing().then(setPricing); }, []);

  const setRate = (plan: Exclude<MemberPlan, "custom">, gender: "male" | "female", value: string) => {
    if (!pricing) return;
    setPricing({ ...pricing, [plan]: { ...pricing[plan], [gender]: Number(value) } });
  };

  const handleSave = async () => {
    if (!pricing) return;
    setSaving(true);
    await savePricing(pricing);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="glass border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <DollarSign className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <h2 className="text-sm font-semibold text-zinc-200">Membership Rates (₹)</h2>
      </div>

      {!pricing ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-xs text-zinc-500 font-medium pt-2">Plan</div>
            <div className="text-xs text-zinc-500 font-medium text-center pt-2">Male</div>
            <div className="text-xs text-zinc-500 font-medium text-center pt-2">Female</div>

            {plans.map((plan) => (
              <>
                <div key={`label-${plan}`} className="flex items-center text-sm text-zinc-300">
                  {PLAN_LABELS[plan]}
                </div>
                {(["male", "female"] as const).map((gender) => (
                  <input
                    key={`${plan}-${gender}`}
                    type="number"
                    value={pricing[plan][gender]}
                    onChange={(e) => setRate(plan, gender, e.target.value)}
                    min="0"
                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 text-center focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors"
                  />
                ))}
              </>
            ))}
          </div>

          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
            {saved ? "Saved!" : saving ? "Saving..." : "Save Rates"}
          </button>
        </>
      )}
    </div>
  );
}

// ── PIN ───────────────────────────────────────────────────────────────────────

function PinSection() {
  const [current, setCurrent] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = () => {
    setError("");
    const stored = getStoredPin();
    if (stored && current !== stored) { setError("Current PIN is incorrect."); return; }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) { setError("PIN must be exactly 4 digits."); return; }
    if (newPin !== confirm) { setError("PINs do not match."); return; }
    savePin(newPin);
    setSuccess(true);
    setCurrent(""); setNewPin(""); setConfirm("");
    setTimeout(() => setSuccess(false), 2000);
  };

  const hasExistingPin = !!getStoredPin();

  return (
    <div className="glass border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <h2 className="text-sm font-semibold text-zinc-200">Finance PIN</h2>
      </div>

      <div className="space-y-3">
        {hasExistingPin && (
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Current PIN</label>
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)}
              maxLength={4} placeholder="••••"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">New PIN</label>
          <input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)}
            maxLength={4} placeholder="••••"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Confirm New PIN</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            maxLength={4} placeholder="••••"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
        </div>

        {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

        <button onClick={handleChange}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
          {success ? <><Check className="w-3.5 h-3.5" /> Saved!</> : hasExistingPin ? "Change PIN" : "Set PIN"}
        </button>
      </div>
    </div>
  );
}

// ── Account ───────────────────────────────────────────────────────────────────

function AccountSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const reauth = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("Not logged in");
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
  };

  const handleEmailChange = async () => {
    if (!newEmail) { setError("Enter a new email."); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      await reauth();
      await verifyBeforeUpdateEmail(auth.currentUser!, newEmail);
      setSuccess("A verification email has been sent to the new address. Check your inbox and click the link to confirm the change.");
      setCurrentPassword(""); setNewEmail("");
    } catch {
      setError("Failed. Check your current password and try again.");
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      await reauth();
      await updatePassword(auth.currentUser!, newPassword);
      setSuccess("Password updated successfully.");
      setCurrentPassword(""); setNewPassword("");
    } catch {
      setError("Failed. Check your current password and try again.");
    } finally { setSaving(false); }
  };

  return (
    <div className="glass border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
          <KeyRound className="w-3.5 h-3.5 text-green-400" />
        </div>
        <h2 className="text-sm font-semibold text-zinc-200">Account Credentials</h2>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Current Password (required to make changes)</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
        </div>

        <div className="border-t border-zinc-800 pt-3">
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">New Email</label>
          <div className="flex gap-2">
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@email.com"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
            <button onClick={handleEmailChange} disabled={saving}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors disabled:opacity-50">
              Update
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">New Password</label>
          <div className="flex gap-2">
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors" />
            <button onClick={handlePasswordChange} disabled={saving}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors disabled:opacity-50">
              Update
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{success}</p>}
      </div>
    </div>
  );
}
