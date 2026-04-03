"use client";

import { useEffect, useState, useCallback } from "react";
import { getPayments } from "@/lib/members";
import { getPTPayments, getTrainers } from "@/lib/trainers";
import { Payment, PTPayment, Trainer, PLAN_LABELS } from "@/lib/types";
import PinLock from "@/components/PinLock";
import RevenueChart from "@/components/RevenueChart";
import { Lock, TrendingUp, Receipt, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FinancesPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<"gym" | "pt">("gym");

  // Lock again when navigating away and back
  useEffect(() => {
    return () => setUnlocked(false);
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {!unlocked && <PinLock onUnlocked={() => setUnlocked(true)} />}

      <div className={unlocked ? "" : "blur-sm pointer-events-none select-none"}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">Finances</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Revenue & transaction history</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5">
            <Lock className="w-3 h-3 text-purple-400" />
            PIN protected
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab("gym")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              activeTab === "gym"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Gym Finances
          </button>
          <button
            onClick={() => setActiveTab("pt")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              activeTab === "pt"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Personal Trainers
          </button>
        </div>

        {unlocked && activeTab === "gym" && <GymFinancesTab />}
        {unlocked && activeTab === "pt" && <PTFinancesTab />}
      </div>
    </div>
  );
}

// ── Gym Finances Tab ──────────────────────────────────────────────────────────

function GymFinancesTab() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getPayments();
    setPayments(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthRevenue = payments
    .filter((p) => p.date.startsWith(thisMonth))
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass border border-zinc-800 rounded-2xl p-4">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xs text-zinc-500 mb-1">This Month</p>
          <p className="text-2xl font-bold text-zinc-100">₹{monthRevenue.toLocaleString()}</p>
        </div>
        <div className="glass border border-zinc-800 rounded-2xl p-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
            <Receipt className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xs text-zinc-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-zinc-100">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {!loading && payments.length > 0 && (
        <div className="glass border border-zinc-800 rounded-2xl p-4 mb-6">
          <p className="text-sm font-medium text-zinc-300 mb-4">Monthly Revenue</p>
          <RevenueChart payments={payments} />
        </div>
      )}

      <div className="glass border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <p className="text-sm font-medium text-zinc-300">Transaction History</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 text-sm">No transactions yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Member</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden sm:table-cell">Plan</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden md:table-cell">Date</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden md:table-cell">Note</th>
                <th className="text-right text-xs font-medium text-zinc-500 px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p.id}
                  className={`border-b border-zinc-800/60 hover:bg-zinc-800/20 transition-colors ${i === payments.length - 1 ? "border-b-0" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-zinc-100">{p.memberName}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-zinc-400">{PLAN_LABELS[p.plan]}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-zinc-500">{p.date}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-zinc-600">{p.note || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-green-400">₹{p.amount.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ── PT Finances Tab ───────────────────────────────────────────────────────────

function PTFinancesTab() {
  const [ptPayments, setPTPayments] = useState<PTPayment[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [payments, t] = await Promise.all([getPTPayments(), getTrainers()]);
    setPTPayments(payments);
    setTrainers(t);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalPT = ptPayments.reduce((sum, p) => sum + p.amount, 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthPT = ptPayments
    .filter((p) => p.date.startsWith(thisMonth))
    .reduce((sum, p) => sum + p.amount, 0);

  // Per-trainer breakdown with individual payments
  const trainerBreakdown = trainers.map((t) => {
    const payments = ptPayments.filter((p) => p.trainerId === t.id);
    return {
      trainer: t,
      payments,
      total: payments.reduce((sum, p) => sum + p.amount, 0),
    };
  }).filter((row) => row.total > 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass border border-zinc-800 rounded-2xl p-4">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-xs text-zinc-500 mb-1">PT This Month</p>
          <p className="text-2xl font-bold text-zinc-100">₹{monthPT.toLocaleString()}</p>
        </div>
        <div className="glass border border-zinc-800 rounded-2xl p-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
            <Receipt className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xs text-zinc-500 mb-1">All Time PT Revenue</p>
          <p className="text-2xl font-bold text-zinc-100">₹{totalPT.toLocaleString()}</p>
        </div>
      </div>

      {/* Per-trainer breakdown */}
      {!loading && trainerBreakdown.length > 0 && (
        <div className="glass border border-zinc-800 rounded-2xl overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-sm font-medium text-zinc-300">Revenue by Trainer</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Trainer</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Member</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden md:table-cell">Date</th>
                <th className="text-right text-xs font-medium text-zinc-500 px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {trainerBreakdown.flatMap((row) =>
                row.payments.map((p, pi) => (
                  <tr key={p.id}
                    className={`border-b border-zinc-800/60 hover:bg-zinc-800/20 transition-colors ${
                      pi === row.payments.length - 1 ? "border-b border-zinc-800" : ""
                    }`}>
                    <td className="px-4 py-3">
                      {pi === 0 && (
                        <>
                          <p className="text-sm font-medium text-zinc-100">{row.trainer.name}</p>
                          <p className="text-xs text-zinc-500">Total: ₹{row.total.toLocaleString()}</p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-zinc-200">{p.memberName}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-zinc-500">{p.date}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-green-400">₹{p.amount.toLocaleString()}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PT Transaction History */}
      <div className="glass border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <p className="text-sm font-medium text-zinc-300">PT Transaction History</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        ) : ptPayments.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 text-sm">No PT payments yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Member</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden sm:table-cell">Trainer</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden md:table-cell">Date</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden md:table-cell">Note</th>
                <th className="text-right text-xs font-medium text-zinc-500 px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {ptPayments.map((p, i) => (
                <tr key={p.id}
                  className={`border-b border-zinc-800/60 hover:bg-zinc-800/20 transition-colors ${i === ptPayments.length - 1 ? "border-b-0" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-zinc-100">{p.memberName}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-zinc-400">{p.trainerName}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-zinc-500">{p.date}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-zinc-600">{p.note || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-green-400">₹{p.amount.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
