"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyMembershipCheck = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const resend_1 = require("resend");
admin.initializeApp();
const db = admin.firestore();
// ── Helpers ───────────────────────────────────────────────────────────────────
function daysDiff(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
async function sendEmail(to, subject, html) {
    try {
        const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: "Hybrid Fitness <onboarding@resend.dev>",
            to,
            subject,
            html,
        });
    }
    catch (err) {
        console.error("Email send failed:", err);
    }
}
// ── Email Templates ───────────────────────────────────────────────────────────
function reminderEmailHtml(name, daysLeft, plan) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #09090b; color: #fafafa; padding: 32px; border-radius: 16px;">
      <h2 style="color: #3b82f6; margin-bottom: 8px;">Hybrid Fitness</h2>
      <h3 style="margin-bottom: 16px;">Membership Expiring Soon</h3>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your <strong>${plan}</strong> membership expires in <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong>.</p>
      <p>Please visit the gym to renew your membership and continue your fitness journey.</p>
      <div style="margin: 24px 0; padding: 16px; background: rgba(59,130,246,0.1); border-radius: 8px; border-left: 3px solid #3b82f6;">
        <p style="margin: 0; font-size: 14px; color: #93c5fd;">Renew before your membership expires to maintain continuity.</p>
      </div>
      <p style="color: #71717a; font-size: 13px;">— Hybrid Fitness Team</p>
    </div>
  `;
}
function overdueEmailHtml(name, plan) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #09090b; color: #fafafa; padding: 32px; border-radius: 16px;">
      <h2 style="color: #f97316; margin-bottom: 8px;">Hybrid Fitness</h2>
      <h3 style="margin-bottom: 16px;">Payment Overdue</h3>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your <strong>${plan}</strong> membership has expired and your payment is now overdue.</p>
      <p>You have a <strong>5-day grace period</strong> to renew. Please visit the gym as soon as possible to keep your membership active.</p>
      <div style="margin: 24px 0; padding: 16px; background: rgba(249,115,22,0.1); border-radius: 8px; border-left: 3px solid #f97316;">
        <p style="margin: 0; font-size: 14px; color: #fdba74;">After the grace period, your membership will be marked as expired.</p>
      </div>
      <p style="color: #71717a; font-size: 13px;">— Hybrid Fitness Team</p>
    </div>
  `;
}
// ── Daily Status Update & Notifications ──────────────────────────────────────
exports.dailyMembershipCheck = (0, scheduler_1.onSchedule)({ schedule: "every 24 hours", secrets: ["RESEND_API_KEY"] }, async () => {
    const snapshot = await db.collection("members").get();
    const batch = db.batch();
    const emailPromises = [];
    for (const docSnap of snapshot.docs) {
        const member = docSnap.data();
        if (!member.expiryDate || member.status === "pending")
            continue;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(member.expiryDate);
        expiry.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today.getTime() - expiry.getTime()) / (1000 * 60 * 60 * 24));
        // Compute new status
        let newStatus;
        if (diffDays < 0)
            newStatus = "active";
        else if (diffDays <= 5)
            newStatus = "overdue";
        else
            newStatus = "expired";
        // Update status if changed
        if (newStatus !== member.status) {
            batch.update(docSnap.ref, { status: newStatus });
            // Send overdue notification
            if (newStatus === "overdue" && member.email) {
                emailPromises.push(sendEmail(member.email, "⚠️ Payment Overdue — Hybrid Fitness", overdueEmailHtml(member.name, member.plan)));
            }
        }
        // Send 3-day reminder if active and expiring in exactly 3 days
        const daysUntilExpiry = daysDiff(member.expiryDate);
        if (member.status === "active" && daysUntilExpiry === 3 && member.email) {
            emailPromises.push(sendEmail(member.email, "⏰ Membership Expiring in 3 Days — Hybrid Fitness", reminderEmailHtml(member.name, 3, member.plan)));
        }
        // Send 1-day reminder
        if (member.status === "active" && daysUntilExpiry === 1 && member.email) {
            emailPromises.push(sendEmail(member.email, "⏰ Membership Expiring Tomorrow — Hybrid Fitness", reminderEmailHtml(member.name, 1, member.plan)));
        }
    }
    await batch.commit();
    await Promise.all(emailPromises);
    console.log(`Daily check complete. Processed ${snapshot.docs.length} members.`);
});
//# sourceMappingURL=index.js.map