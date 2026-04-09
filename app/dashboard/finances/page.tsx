"use client";

import { useEffect, useState, useCallback } from "react";
import { getPayments, deletePayment } from "@/lib/members";
import { getPTPayments, getTrainers, deletePTPayment } from "@/lib/trainers";
import { Payment, PTPayment, Trainer, PLAN_LABELS } from "@/lib/types";
import PinLock from "@/components/PinLock";
import RevenueChart from "@/components/RevenueChart";
import { Lock, TrendingUp, Receipt, Loader2, ChevronDown, Trash2 } from "lucide-react";
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
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(lastOfMonth);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getPayments();
    setPayments(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  const filtered = payments.filter((p) => {
    if (genderFilter !== "all" && p.gender !== genderFilter) return false;
    if (dateFrom && p.date < dateFrom) return false;
    if (dateTo && p.date > dateTo) return false;
    return true;
  });

  const periodRevenue = filtered.reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Gender toggle */}
        <div className="flex gap-0.5 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
          {(["all", "male", "female"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-all capitalize",
                genderFilter === g
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {g === "all" ? "All" : g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
          />
          <span>To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass border border-zinc-800 rounded-2xl p-4">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xs text-zinc-500 mb-1">Selected Period</p>
          <p className="text-2xl font-bold text-zinc-100">₹{periodRevenue.toLocaleString()}</p>
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 text-sm">No transactions for selected filters.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Member</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden sm:table-cell">Plan</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden md:table-cell">Date</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden md:table-cell">Note</th>
                <th className="text-right text-xs font-medium text-zinc-500 px-4 py-3">Amount</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id}
                  className={`border-b border-zinc-800/60 hover:bg-zinc-800/20 transition-colors ${i === filtered.length - 1 ? "border-b-0" : ""}`}>
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
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete ₹${p.amount.toLocaleString()} payment for ${p.memberName}?`)) return;
                        await deletePayment(p.id);
                        load();
                      }}
                      className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
  const [expandedTrainer, setExpandedTrainer] = useState<string | null>(null);
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
        <div className="space-y-4 mb-6">
          <p className="text-sm font-medium text-zinc-300">Revenue by Trainer</p>
          {trainerBreakdown.map((row) => (
            <div key={row.trainer.id} className="glass border border-zinc-800 rounded-2xl overflow-hidden">
              {/* Trainer header with total — click to expand/collapse */}
              <button
                type="button"
                onClick={() => setExpandedTrainer(expandedTrainer === row.trainer.id ? null : row.trainer.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/40 hover:bg-zinc-800/40 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{row.trainer.name}</p>
                  <p className="text-xs text-zinc-500">{row.trainer.specialization}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 mb-0.5">Total Revenue</p>
                    <p className="text-lg font-bold text-green-400">₹{row.total.toLocaleString()}</p>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-200", expandedTrainer === row.trainer.id && "rotate-180")} />
                </div>
              </button>
              {/* Individual payment rows — collapsible */}
              {expandedTrainer === row.trainer.id && (
                <table className="w-full border-t border-zinc-800">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">Member</th>
                      <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2 hidden md:table-cell">Date</th>
                      <th className="text-right text-xs font-medium text-zinc-500 px-4 py-2">Amount</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.payments.map((p, pi) => (
                      <tr key={p.id}
                        className={`hover:bg-zinc-800/20 transition-colors ${pi < row.payments.length - 1 ? "border-b border-zinc-800/60" : ""}`}>
                        <td className="px-4 py-2.5">
                          <p className="text-sm text-zinc-200">{p.memberName}</p>
                        </td>
                        <td className="px-4 py-2.5 hidden md:table-cell">
                          <span className="text-xs text-zinc-500">{p.date}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="text-sm font-semibold text-green-400">₹{p.amount.toLocaleString()}</span>
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <button
                            onClick={async () => {
                              if (!confirm(`Delete ₹${p.amount.toLocaleString()} PT payment for ${p.memberName}?`)) return;
                              await deletePTPayment(p.id);
                              load();
                            }}
                            className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
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
                <th className="w-10"></th>
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
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete ₹${p.amount.toLocaleString()} PT payment for ${p.memberName}?`)) return;
                        await deletePTPayment(p.id);
                        load();
                      }}
                      className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
