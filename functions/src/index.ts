import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysDiff(dateStr: string, referenceDate: Date): number {
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
}

async function sendSMS(phone: string, message: string): Promise<void> {
  try {
    const authKey = process.env.MSG91_AUTH_KEY;
    const senderId = process.env.MSG91_SENDER_ID ?? "HYBFIT";
    if (!authKey) {
      console.warn("MSG91_AUTH_KEY not set — SMS skipped for", phone);
      return;
    }
    const payload = {
      sender: senderId,
      route: "4",
      country: "91",
      sms: [{ message, to: [phone] }],
    };
    const res = await fetch("https://api.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: authKey,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("MSG91 error:", await res.text());
    }
  } catch (err) {
    console.error("SMS send failed:", err);
  }
}

// ── Daily Status Update & Notifications ──────────────────────────────────────

export const dailyMembershipCheck = onSchedule(
  { schedule: "every 24 hours", secrets: ["MSG91_AUTH_KEY", "MSG91_SENDER_ID"] },
  async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pre-fetch Google review link once
    const settingsSnap = await db.doc("config/settings").get();
    const reviewLink: string = settingsSnap.exists
      ? (settingsSnap.data()?.googleReviewLink ?? "")
      : "";

    // ── Membership status + SMS ──────────────────────────────────────────────
    const snapshot = await db.collection("members").get();
    const memberBatch = db.batch();
    const smsPromises: Promise<void>[] = [];

    for (const docSnap of snapshot.docs) {
      const member = docSnap.data();
      if (!member.expiryDate || member.status === "pending") continue;

      const expiry = new Date(member.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - expiry.getTime()) / (1000 * 60 * 60 * 24));

      // Compute new status
      let newStatus: string;
      if (diffDays < 0) newStatus = "active";
      else if (diffDays <= 5) newStatus = "overdue";   // 5-day grace period
      else newStatus = "expired";

      // Update status if changed
      if (newStatus !== member.status) {
        memberBatch.update(docSnap.ref, { status: newStatus });

        if (newStatus === "overdue" && member.phone) {
          smsPromises.push(
            sendSMS(
              member.phone,
              `Hi ${member.name}, your Hybrid Fitness membership has expired. You have a 5-day grace period to renew. Please visit us soon.`
            )
          );
        }
      }

      // 3-day reminder
      const daysUntilExpiry = daysDiff(member.expiryDate, today);
      if (member.status === "active" && daysUntilExpiry === 3 && member.phone) {
        smsPromises.push(
          sendSMS(
            member.phone,
            `Hi ${member.name}, your Hybrid Fitness membership expires in 3 days. Please visit us to renew.`
          )
        );
      }

      // 1-day reminder
      if (member.status === "active" && daysUntilExpiry === 1 && member.phone) {
        smsPromises.push(
          sendSMS(
            member.phone,
            `Hi ${member.name}, your Hybrid Fitness membership expires tomorrow. Please renew today.`
          )
        );
      }

      // 30-day review SMS
      if (member.createdAt && member.phone) {
        const joinDate = new Date(member.createdAt);
        joinDate.setHours(0, 0, 0, 0);
        const joinedDaysAgo = Math.floor((today.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
        if (joinedDaysAgo === 30) {
          const reviewPart = reviewLink ? ` Rate us on Google: ${reviewLink}` : "";
          smsPromises.push(
            sendSMS(
              member.phone,
              `Hi ${member.name}, you've completed 1 month at Hybrid Fitness! We'd love your feedback.${reviewPart}`
            )
          );
        }
      }
    }

    await memberBatch.commit();

    // ── PT auto-unassignment ─────────────────────────────────────────────────
    const ptSnapshot = await db.collection("ptRequests")
      .where("status", "==", "active")
      .get();
    const ptBatch = db.batch();

    for (const ptDoc of ptSnapshot.docs) {
      const req = ptDoc.data();
      if (!req.expiryDate) continue;
      const ptExpiry = new Date(req.expiryDate);
      ptExpiry.setHours(0, 0, 0, 0);
      if (today >= ptExpiry) {
        ptBatch.update(ptDoc.ref, { status: "unassigned" });
      }
    }
    await ptBatch.commit();

    await Promise.all(smsPromises);

    console.log(
      `Daily check complete. Members: ${snapshot.docs.length}, PT requests: ${ptSnapshot.docs.length}.`
    );
  }
);
