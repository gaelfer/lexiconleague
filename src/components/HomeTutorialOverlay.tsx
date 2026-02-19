"use client";

import { useEffect, useMemo, useState } from "react";
import InkAvatar from "@/components/InkAvatar";

interface HomeTutorialOverlayProps {
  open: boolean;
  light: boolean;
  onFinish: () => void;
}

type TutorialStep = {
  id: string;
  targetId?: string;
  title: string;
  text: string;
};

type Rect = { top: number; left: number; width: number; height: number };

const STEPS: TutorialStep[] = [
  {
    id: "intro",
    title: "Welcome to Lexicon League!",
    text: "I am Sir Inksworth, your League Guide. I will show you around so you can jump in fast and play with confidence.",
  },
  {
    id: "casual",
    targetId: "casual",
    title: "Casual Mode",
    text: "Start here for low-pressure practice. Casual mode is perfect for warmups, trying punctuation sets, and building confidence before ranked runs.",
  },
  {
    id: "ranked",
    targetId: "ranked",
    title: "Ranked Mode",
    text: "This is where you earn trophies and climb the ladder. Win games to rank up.",
  },
  {
    id: "leaderboard",
    targetId: "leaderboard",
    title: "Leaderboard Screen",
    text: "Open this to enter the leaderboard screen and check your position against other players in your tier.",
  },
  {
    id: "shop",
    targetId: "shop",
    title: "Ink Shop",
    text: "Visit the shop to spend Ink Drops on cosmetics and style upgrades. It is also where you claim your daily reward when it is ready.",
  },
  {
    id: "daily-reward",
    targetId: "daily-reward",
    title: "Daily Rewards",
    text: "When this appears, jump into the Ink Shop and claim your free daily reward to keep your drops stacking up.",
  },
  {
    id: "locker",
    targetId: "locker",
    title: "Ink Locker",
    text: "Customize your Inkling appearance and equip your unlocked items.",
  },
  {
    id: "friends",
    targetId: "friends",
    title: "Friends",
    text: "Add friends, build a party, and queue together for casual matches.",
  },
  {
    id: "done",
    title: "You are all set!",
    text: "Good luck, challenger. Tap finish and start your first run.",
  },
];

function getTargetRect(targetId?: string): Rect | null {
  if (!targetId) return null;
  const element = document.querySelector(`[data-tutorial-id="${targetId}"]`) as HTMLElement | null;
  if (!element) return null;
  const box = element.getBoundingClientRect();
  const pad = 8;
  return {
    top: Math.max(8, box.top - pad),
    left: Math.max(8, box.left - pad),
    width: box.width + pad * 2,
    height: box.height + pad * 2,
  };
}

export default function HomeTutorialOverlay({ open, light, onFinish }: HomeTutorialOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const [targetRect, setTargetRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (step.targetId) {
      const element = document.querySelector(`[data-tutorial-id="${step.targetId}"]`) as HTMLElement | null;
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }
    }
    const refresh = () => setTargetRect(getTargetRect(step.targetId));
    refresh();
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);
    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
    };
  }, [open, step.targetId]);

  const progress = useMemo(
    () => Math.round(((stepIndex + 1) / STEPS.length) * 100),
    [stepIndex]
  );

  if (!open) return null;

  const panelBg = light ? "bg-white border-[#E2E8F0]" : "bg-[#1E293B] border-white/10";
  const panelText = light ? "text-[#0F172A]" : "text-white";
  const panelMuted = light ? "text-[#64748B]" : "text-white/70";
  const shouldPinPanelTop =
    !!targetRect && (typeof window !== "undefined" ? targetRect.top > window.innerHeight * 0.55 : false);

  function goNext() {
    if (stepIndex >= STEPS.length - 1) {
      onFinish();
      return;
    }
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  return (
    <div className="fixed inset-0 z-[300]">
      <div className="absolute inset-0 bg-[#0F172A]/45" />

      {targetRect && (
        <>
          <div
            className="absolute rounded-2xl border-2 border-[#34D399] pointer-events-none"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
            }}
          />
          <div
            className="absolute pointer-events-none px-2 py-1 rounded-md text-xs font-bold text-white bg-[#34D399]"
            style={{
              top: targetRect.top > 36 ? targetRect.top - 28 : targetRect.top + targetRect.height + 8,
              left: targetRect.left,
            }}
          >
            Click here
          </div>
        </>
      )}

      <div className={`absolute inset-x-0 p-4 sm:p-6 ${shouldPinPanelTop ? "top-0" : "bottom-0"}`}>
        <div className={`max-w-2xl mx-auto rounded-2xl border ${panelBg}`}>
          <div className="px-4 pt-4 sm:px-5 sm:pt-5">
            <div className="flex items-start gap-4">
              <div
                className={`shrink-0 w-[100px] h-[100px] rounded-xl flex items-center justify-center ${light ? "bg-[#F1F5F9] border border-[#E2E8F0]" : "bg-white/5 border border-white/10"}`}
              >
                <InkAvatar
                  config={{ base: "droplet_03", color: "#0F172A", eyes: "eyes_02", accessory: "suit_01", aura: "none" }}
                  size={88}
                />
              </div>
              <div className="min-w-0 pt-1">
                <p className={`text-base font-extrabold ${panelText}`}>Sir Inksworth</p>
                <p className={`text-xs font-semibold ${panelMuted} mb-2`}>Tutorial {progress}%</p>
                <h3 className={`text-base sm:text-lg font-extrabold ${panelText}`}>{step.title}</h3>
                <p className={`mt-1 text-sm sm:text-base ${panelMuted}`}>{step.text}</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-5 sm:py-5 flex items-center justify-between gap-2">
            <button
              onClick={onFinish}
              className={`text-sm font-bold px-4 py-2 rounded-xl ${light ? "bg-[#F1F5F9] text-[#64748B]" : "bg-white/10 text-white/80"}`}
            >
              Skip
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={goBack}
                disabled={stepIndex === 0}
                className={`text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-50 ${light ? "bg-[#E2E8F0] text-[#334155]" : "bg-white/15 text-white"}`}
              >
                Back
              </button>
              <button
                onClick={goNext}
                className="text-sm font-bold px-4 py-2 rounded-xl text-white bg-[#3B82F6]"
              >
                {stepIndex === STEPS.length - 1 ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
