import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  Timestamp,
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
  status: MemberStatus,
  expiryDate: string | null,
  plan: MemberPlan,
  paymentDate: string
): string {
  const duration = PLAN_DURATIONS[plan];

  if (status === "overdue" && expiryDate) {
    // Renewing during overdue window: continue from original expiry
    return addDays(expiryDate, duration);
  }
  // New member or expired member: fresh start from payment date
  return addDays(paymentDate, duration);
}

export function computeStatus(expiryDate: string | null): MemberStatus {
  if (!expiryDate) return "pending";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - expiry.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "active";
  if (diffDays <= 5) return "overdue";
  return "expired";
}

// ── Members ───────────────────────────────────────────────────────────────────

export async function getMembers(): Promise<Member[]> {
  const q = query(collection(db, "members"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const member = { id: doc.id, ...data } as Member;
    // Recompute live status based on expiry date
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
  note?: string
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const newExpiry = computeExpiryDate(member.status, member.expiryDate, plan, today);

  // Save payment record
  await addDoc(collection(db, "payments"), {
    memberId: member.id,
    memberName: member.name,
    plan,
    amount,
    date: today,
    note: note ?? "",
  });

  // Update member
  await updateDoc(doc(db, "members", member.id), {
    plan,
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
