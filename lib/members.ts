import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import { Member, Payment, MemberPlan, MemberStatus, PLAN_DURATIONS, PricingConfig, DEFAULT_PRICING } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export function computeExpiryDate(
  plan: MemberPlan,
  periodStartDate: string,
  customDays?: number
): string {
  if (plan === "custom") {
    return addDays(periodStartDate, customDays ?? 1);
  }
  return addDays(periodStartDate, PLAN_DURATIONS[plan]);
}

// Returns the smart default start date for the next membership period
export function defaultPeriodStartDate(
  status: MemberStatus,
  expiryDate: string | null
): string {
  const today = new Date().toISOString().split("T")[0];
  // Overdue: next period starts from original expiry date
  if (status === "overdue" && expiryDate) return expiryDate;
  // Expired or new: fresh start from today
  return today;
}

export function computeStatus(expiryDate: string | null): MemberStatus {
  if (!expiryDate) return "pending";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - expiry.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "active";
  if (diffDays <= 3) return "overdue";   // 3-day grace period
  return "expired";
}

// ── Members ───────────────────────────────────────────────────────────────────

export async function getMembers(): Promise<Member[]> {
  const q = query(collection(db, "members"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const member = { id: doc.id, ...data } as Member;
    if (member.status !== "pending") {
      member.status = computeStatus(member.expiryDate);
    }
    return member;
  });
}

export async function getMember(id: string): Promise<Member | null> {
  const ref = doc(db, "members", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const member = { id: snap.id, ...snap.data() } as Member;
  if (member.status !== "pending") {
    member.status = computeStatus(member.expiryDate);
  }
  return member;
}

export async function addMember(data: Omit<Member, "id" | "createdAt" | "status" | "expiryDate">): Promise<string> {
  const ref = await addDoc(collection(db, "members"), {
    ...data,
    status: "pending",
    expiryDate: null,
    createdAt: new Date().toISOString().split("T")[0],
  });
  return ref.id;
}

export async function updateMember(id: string, data: Partial<Member>): Promise<void> {
  await updateDoc(doc(db, "members", id), { ...data });
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function recordPayment(
  member: Member,
  plan: MemberPlan,
  amount: number,
  periodStartDate: string,
  customDays?: number,
  note?: string
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const newExpiry = computeExpiryDate(plan, periodStartDate, customDays);

  await addDoc(collection(db, "payments"), {
    memberId: member.id,
    memberName: member.name,
    plan,
    ...(customDays ? { customDays } : {}),
    amount,
    date: today,
    note: note ?? "",
  });

  await updateDoc(doc(db, "members", member.id), {
    plan,
    ...(customDays ? { customDays } : {}),
    expiryDate: newExpiry,
    status: "active",
  });
}

export async function getPayments(): Promise<Payment[]> {
  const q = query(collection(db, "payments"), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Payment));
}

// ── Pricing ───────────────────────────────────────────────────────────────────

export async function getPricing(): Promise<PricingConfig> {
  const ref = doc(db, "config", "pricing");
  const snap = await getDoc(ref);
  if (!snap.exists()) return DEFAULT_PRICING;
  return snap.data() as PricingConfig;
}

export async function savePricing(pricing: PricingConfig): Promise<void> {
  const ref = doc(db, "config", "pricing");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { ...pricing });
  } else {
    const { setDoc } = await import("firebase/firestore");
    await setDoc(ref, pricing);
  }
}
