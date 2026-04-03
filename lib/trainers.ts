import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { Trainer, PTRequest, PTPayment } from "./types";

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

// ── Trainers ──────────────────────────────────────────────────────────────────

export async function getTrainers(): Promise<Trainer[]> {
  const q = query(collection(db, "trainers"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trainer));
}

export async function addTrainer(data: Omit<Trainer, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, "trainers"), {
    ...data,
    createdAt: new Date().toISOString().split("T")[0],
  });
  return ref.id;
}

export async function updateTrainer(id: string, data: Partial<Trainer>): Promise<void> {
  await updateDoc(doc(db, "trainers", id), { ...data });
}

export async function deleteTrainer(id: string): Promise<void> {
  await deleteDoc(doc(db, "trainers", id));
}

// ── PT Requests ───────────────────────────────────────────────────────────────

export async function getPTRequests(): Promise<PTRequest[]> {
  const q = query(collection(db, "ptRequests"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PTRequest));
}

export async function getPendingPTRequests(): Promise<PTRequest[]> {
  const q = query(
    collection(db, "ptRequests"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PTRequest));
}

export async function submitPTRequest(data: Omit<PTRequest, "id" | "createdAt" | "status" | "amount" | "startDate" | "expiryDate">): Promise<string> {
  const ref = await addDoc(collection(db, "ptRequests"), {
    ...data,
    status: "pending",
    createdAt: new Date().toISOString().split("T")[0],
  });
  return ref.id;
}

export async function approvePTRequest(requestId: string, amount: number): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const expiryDate = addDays(today, 30);

  const ref = doc(db, "ptRequests", requestId);
  const snap = await import("firebase/firestore").then(({ getDoc }) => getDoc(ref));
  if (!snap.exists()) throw new Error("PT request not found");
  const data = snap.data() as PTRequest;

  await updateDoc(ref, {
    status: "active",
    amount,
    startDate: today,
    expiryDate,
  });

  // Log PT payment
  await addDoc(collection(db, "ptPayments"), {
    memberId: data.memberId,
    memberName: data.memberName,
    trainerId: data.trainerId,
    trainerName: data.trainerName,
    amount,
    date: today,
    note: "",
  });
}

// ── PT Payments ───────────────────────────────────────────────────────────────

export async function getPTPayments(): Promise<PTPayment[]> {
  const q = query(collection(db, "ptPayments"), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PTPayment));
}
