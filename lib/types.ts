export type MemberStatus = "pending" | "active" | "overdue" | "expired";
export type MemberPlan = "monthly" | "quarterly" | "half-yearly" | "yearly" | "custom";
export type MemberGender = "male" | "female";

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: MemberGender;
  plan: MemberPlan;
  customDays?: number;       // only set when plan === "custom"
  startDate: string;         // ISO date string
  expiryDate: string | null;
  status: MemberStatus;
  createdAt: string;         // ISO date string
}

export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  plan: MemberPlan;
  customDays?: number;
  amount: number;
  date: string;              // ISO date string
  note?: string;
}

export interface PricingConfig {
  monthly: { male: number; female: number };
  quarterly: { male: number; female: number };
  "half-yearly": { male: number; female: number };
  yearly: { male: number; female: number };
}

export const PLAN_DURATIONS: Record<Exclude<MemberPlan, "custom">, number> = {
  monthly: 30,
  quarterly: 90,
  "half-yearly": 180,
  yearly: 365,
};

export const PLAN_LABELS: Record<MemberPlan, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  "half-yearly": "Half-Yearly",
  yearly: "Yearly",
  custom: "Custom",
};

export const DEFAULT_PRICING: PricingConfig = {
  monthly: { male: 1000, female: 800 },
  quarterly: { male: 2800, female: 2200 },
  "half-yearly": { male: 5000, female: 4000 },
  yearly: { male: 9000, female: 7500 },
};
