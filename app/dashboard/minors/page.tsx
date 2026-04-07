"use client";

import { useEffect, useState, useCallback } from "react";
import { getMembers } from "@/lib/members";
import { Member, MinorConsent } from "@/lib/types";
import { ShieldAlert, Loader2, X } from "lucide-react";

export default function MinorsPage() {
  const [minors, setMinors] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewConsent, setViewConsent] = useState<Member | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await getMembers();
    setMinors(all.filter((m) => m.age !== undefined && m.age <= 15 && m.status === "active"));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Minors</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Members aged 15 and under with parental consent on file</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          {minors.length} minor{minors.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="glass border border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        ) : minors.length === 0 ? (
          <div className="text-center py-16 text-zinc-600 text-sm">No minor members registered yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Member</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Age</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden sm:table-cell">Parent / Guardian</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden md:table-cell">Parent Phone</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden md:table-cell">Date Joined</th>
                <th className="text-right text-xs font-medium text-zinc-500 px-4 py-3">Consent</th>
              </tr>
            </thead>
            <tbody>
              {minors.map((m, i) => (
                <tr
                  key={m.id}
                  className={`border-b border-zinc-800/60 hover:bg-zinc-800/20 transition-colors ${i === minors.length - 1 ? "border-b-0" : ""}`}
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-zinc-100">{m.name}</p>
                    <p className="text-xs text-zinc-500">{m.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-zinc-300">{m.age}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {m.minorConsent ? (
                      <div>
                        <p className="text-sm text-zinc-200">{m.minorConsent.parentName}</p>
                        <p className="text-xs text-zinc-500">{m.minorConsent.relationship}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-zinc-400">{m.minorConsent?.parentPhone ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-zinc-500">{m.createdAt}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.minorConsent ? (
                      <button
                        onClick={() => setViewConsent(m)}
                        className="text-xs text-blue-400 hover:text-blue-300 border border-blue-600/30 hover:border-blue-500/50 bg-blue-600/10 hover:bg-blue-600/15 rounded-lg px-2.5 py-1 transition-colors"
                      >
                        View Consent
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-600">No consent</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewConsent && viewConsent.minorConsent && (
        <ConsentModal member={viewConsent} consent={viewConsent.minorConsent} onClose={() => setViewConsent(null)} />
      )}
    </div>
  );
}

function ConsentModal({ member, consent, onClose }: { member: Member; consent: MinorConsent; onClose: () => void }) {
  const today = consent.acknowledgedAt ?? member.createdAt;
  const [day, month, year] = [
    String(new Date(today).getDate()).padStart(2, "0"),
    String(new Date(today).getMonth() + 1).padStart(2, "0"),
    String(new Date(today).getFullYear()),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Parental Consent Form</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{member.name}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4 text-xs text-zinc-300">
          <p className="text-sm font-bold text-zinc-100 uppercase tracking-wider text-center">
            Parental Consent &amp; Liability Waiver for Minors
          </p>
          <p className="text-center text-zinc-400">HYBRID FITNESS – INDIA</p>
          <p className="text-zinc-400">Date: {day} / {month} / {year}</p>

          <Section title="1. Minor Participant Details">
            <Field label="Full Name" value={member.name} />
            <Field label="Age" value={String(member.age ?? "—")} />
          </Section>

          <Section title="2. Parent / Guardian Details">
            <Field label="Full Name" value={consent.parentName} />
            <Field label="Relationship to Minor" value={consent.relationship} />
            <Field label="Primary Contact Number" value={consent.parentPhone} />
            <Field label="Emergency Contact Number" value={consent.emergencyPhone} />
          </Section>

          <Section title="3. Consent">
            <p className="text-zinc-400 leading-relaxed">
              The undersigned parent/legal guardian granted permission for the minor child to participate in gym/fitness activities and utilize professional equipment at <span className="text-zinc-200 font-medium">Hybrid Fitness</span>.
            </p>
          </Section>

          <Section title="4. Risk Acknowledgment">
            <p className="text-zinc-400 leading-relaxed">
              Physical exercise and gym activities involve inherent risks of injury, including but not limited to strains, sprains, falls, or other physical harm. The parent/guardian voluntarily accepted and assumed these risks on behalf of the child.
            </p>
          </Section>

          <Section title="5. Medical Declaration">
            <p className="text-zinc-400 leading-relaxed mb-2">
              The child is confirmed medically fit with no underlying conditions restricting physical activity.
            </p>
            <Field label="Known Medical Conditions / Allergies" value={consent.medicalConditions || "None declared"} />
          </Section>

          <Section title="6. Liability Waiver">
            <p className="text-zinc-400 leading-relaxed">
              The parent/guardian agreed that Hybrid Fitness, its owners, trainers, and staff shall not be held liable for any injury, disability, or loss arising from participation or presence on the premises, except in cases of proven gross negligence.
            </p>
          </Section>

          <Section title="7. Emergency Consent">
            <p className="text-zinc-400 leading-relaxed">
              Hybrid Fitness is authorised to provide or arrange necessary medical treatment in the event of an emergency. The parent/guardian agreed to bear all related medical and transportation expenses.
            </p>
          </Section>

          <Section title="8. Declaration">
            <p className="text-zinc-400 leading-relaxed">
              The parent/guardian confirmed having read, understood, and voluntarily agreed to the terms of this consent and liability waiver.
            </p>
            <div className="mt-2 pt-2 border-t border-zinc-800">
              <Field label="Parent/Guardian" value={consent.parentName} />
              <Field label="Acknowledged on" value={consent.acknowledgedAt} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-zinc-200 uppercase tracking-wider border-b border-zinc-800 pb-1">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-zinc-500 shrink-0">{label}:</span>
      <span className="text-zinc-200">{value}</span>
    </div>
  );
}
