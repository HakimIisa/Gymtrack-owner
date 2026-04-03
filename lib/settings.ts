import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface AppSettings {
  googleReviewLink: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  googleReviewLink: "",
};

export async function getSettings(): Promise<AppSettings> {
  const ref = doc(db, "config", "settings");
  const snap = await getDoc(ref);
  if (!snap.exists()) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...snap.data() } as AppSettings;
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const ref = doc(db, "config", "settings");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { ...settings });
  } else {
    await setDoc(ref, { ...DEFAULT_SETTINGS, ...settings });
  }
}
