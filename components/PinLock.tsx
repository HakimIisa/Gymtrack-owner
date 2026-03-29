"use client";

import { useState, useEffect } from "react";
import { Lock, Delete } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "gymtrack_pin";

interface Props {
  onUnlocked: () => void;
}

export function getStoredPin(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function savePin(pin: string): void {
  localStorage.setItem(STORAGE_KEY, pin);
}

export default function PinLock({ onUnlocked }: Props) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "set" | "confirm">("enter");

  useEffect(() => {
    const stored = getStoredPin();
    if (!stored) setStep("set");
    else setStep("enter");
  }, []);

  const triggerShake = () => {
    setShake(true);
    setError(true);
    setTimeout(() => { setShake(false); setError(false); setInput(""); }, 600);
  };

  const handleDigit = (digit: string) => {
    if (input.length >= 4) return;
    const next = input + digit;
    setInput(next);

    if (next.length === 4) {
      setTimeout(() => {
        if (step === "enter") {
          const stored = getStoredPin();
          if (next === stored) {
            onUnlocked();
          } else {
            triggerShake();
          }
        } else if (step === "set") {
          setConfirmPin(next);
          setInput("");
          setStep("confirm");
        } else if (step === "confirm") {
          if (next === confirmPin) {
            savePin(confirmPin);
            onUnlocked();
          } else {
            triggerShake();
            setStep("set");
            setConfirmPin("");
          }
        }
      }, 100);
    }
  };

  const handleDelete = () => setInput((prev) => prev.slice(0, -1));

  const digits = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  const title = step === "enter" ? "Enter PIN" : step === "set" ? "Set a 4-Digit PIN" : "Confirm PIN";
  const subtitle = step === "enter" ? "Enter your PIN to view finances"
    : step === "set" ? "Choose a PIN to protect this page"
    : "Re-enter your PIN to confirm";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* Blurred background */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <div className="relative">
        {/* Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-600/20 flex items-center justify-center mb-4 glow-purple">
            <Lock className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-zinc-50">{title}</h2>
          <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>
        </div>

        {/* Dots */}
        <div className={cn("flex justify-center gap-3 mb-8", shake && "animate-[shake_0.4s_ease-in-out]")}>
          {[0,1,2,3].map((i) => (
            <div key={i} className={cn(
              "w-3 h-3 rounded-full border-2 transition-all duration-150",
              input.length > i
                ? error ? "bg-red-500 border-red-500" : "bg-blue-400 border-blue-400"
                : "bg-transparent border-zinc-600"
            )} />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-64">
          {digits.map((d, i) => {
            if (d === "") return <div key={i} />;
            if (d === "⌫") return (
              <button key={i} onClick={handleDelete}
                className="h-14 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all">
                <Delete className="w-5 h-5" />
              </button>
            );
            return (
              <button key={i} onClick={() => handleDigit(d)}
                className="h-14 rounded-2xl glass border border-zinc-800 text-zinc-100 text-xl font-semibold hover:border-zinc-600 hover:bg-zinc-800/60 active:scale-95 transition-all">
                {d}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-center text-xs text-red-400 mt-4">Incorrect PIN. Try again.</p>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
