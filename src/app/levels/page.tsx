"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getProfile, saveProfile, createGuestProfile, claimLevelReward, isLevelRewardClaimed } from "@/lib/user/storage";
import { fetchProfile, claimLevelRewardRemote } from "@/lib/supabase/profile";
import { getLevelProgress, LEVEL_REWARDS } from "@/lib/user/levels";
import InkAvatar from "@/components/InkAvatar";
import InkDropIcon from "@/components/icons/InkDropIcon";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";

const BLUE = "#3B82F6";
const MINT = "#34D399";

function GiftIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C9 3 12 8 12 8" />
      <path d="M16.5 8a2.5 2.5 0 0 0 0-5C15 3 12 8 12 8" />
    </svg>
  );
}

function PaletteIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="0.5" fill={color} stroke={color} />
      <circle cx="17.5" cy="10.5" r="0.5" fill={color} stroke={color} />
      <circle cx="8.5" cy="7.5" r="0.5" fill={color} stroke={color} />
      <circle cx="6.5" cy="12.5" r="0.5" fill={color} stroke={color} />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function CrownIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

function StarIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function LockIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function LevelsPage() {
  const { user } = useAuth();
  const { light } = useTheme();
  const [profile, setProfile] = useState(() => getProfile() ?? createGuestProfile());
  const levelProgress = getLevelProgress(profile.xp);
  const currentLevel = levelProgress.level;

  useEffect(() => {
    setProfile(getProfile() ?? createGuestProfile());
  }, []);

  const bg = light ? "bg-[#F8FAFC]" : "bg-[#0F172A]";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const textFaint = light ? "text-[#94A3B8]" : "text-white/40";
  const cardBg = light ? "bg-white" : "bg-[#1E293B]";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";

  return (
    <main className={`min-h-[100dvh] ${bg} flex flex-col overflow-x-hidden`}>
      <header className="flex items-center justify-between px-5 py-4">
        <Link
          href="/"
          className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${textMuted} ${light ? "hover:text-[#0F172A]" : "hover:text-white"}`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back
        </Link>
        <h1 className={`text-lg font-bold ${text} flex items-center gap-2`}>
          <GiftIcon className="w-5 h-5" color={BLUE} />
          Level & Rewards
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <GlobalNotificationBar />
        </div>
      </header>

      <div className="flex-1 px-4 sm:px-6 py-4 max-w-4xl mx-auto w-full">
        {/* Level progress summary */}
        <div className={`rounded-xl p-4 mb-6 ${cardBg} border ${cardBorder} relative overflow-visible`}>
          <div className="absolute -top-3 -right-4 opacity-80 pointer-events-none" style={{ transform: "rotate(-8deg)" }}>
            <InkAvatar config={{ base: "droplet_03", color: "#8B5CF6", eyes: "eyes_05", accessory: "wizard_01", aura: "aura_glow_02" }} size={56} />
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${light ? "bg-[#DBEAFE]" : "bg-[#3B82F6]/20"}`}>
                <span className="text-lg font-extrabold" style={{ color: BLUE }}>{currentLevel}</span>
              </div>
              <div>
                <p className={`text-sm font-bold ${text}`}>Level {currentLevel}</p>
                <p className={`text-xs ${textFaint}`}>{levelProgress.xpInLevel} / {levelProgress.xpNeededForLevel} XP to next</p>
              </div>
            </div>
            <span className={`text-xs font-bold ${textFaint}`}>{Math.round(levelProgress.progressPercent)}%</span>
          </div>
          <div className={`w-full h-2.5 rounded-full overflow-hidden ${light ? "bg-[#E2E8F0]" : "bg-white/10"}`}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${levelProgress.progressPercent}%`, backgroundColor: BLUE }}
            />
          </div>
        </div>

        {/* Horizontal number-line style roadmap */}
        <div className={`rounded-xl overflow-hidden border ${cardBorder}`}>
          <div className={`px-4 py-3 ${cardBg} border-b ${cardBorder}`}>
            <p className={`text-xs font-semibold ${textFaint}`}>Reward milestones — scroll to explore</p>
          </div>
          <div className={`${cardBg} overflow-x-auto overflow-y-visible py-6 sm:py-8 px-4 sm:px-6`}>
            <div className="relative min-w-max flex items-stretch">
              {/* Horizontal line (number line) — runs through center */}
              <div
                className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full"
                style={{
                  background: light ? "linear-gradient(90deg, #E2E8F0 0%, #94A3B8 50%, #E2E8F0 100%)" : "linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.08) 100%)",
                }}
              />

              {LEVEL_REWARDS.map((reward, i) => {
                const levelReached = currentLevel >= reward.level;
                const claimed = isLevelRewardClaimed(reward.level, profile);
                const claimable = levelReached && !claimed;
                const isNext = !levelReached && reward.level === LEVEL_REWARDS.find(r => r.level > currentLevel)?.level;
                const RewardVisual = reward.type === "ink_drops" ? InkDropIcon : reward.type === "cosmetic" ? PaletteIcon : reward.type === "title" ? CrownIcon : StarIcon;
                const rewardColor = reward.type === "ink_drops" ? MINT : reward.type === "cosmetic" ? "#8B5CF6" : reward.type === "title" ? "#D4AF37" : BLUE;
                const above = i % 2 === 0;

                async function handleClaim() {
                  if (user) {
                    const result = await claimLevelRewardRemote(reward.level);
                    if (result.success) {
                      const remote = await fetchProfile(user.id);
                      if (remote) {
                        saveProfile(remote);
                        setProfile(remote);
                      }
                    }
                    return;
                  }

                  const result = claimLevelReward(reward.level);
                  if (result.success) setProfile(getProfile() ?? profile);
                }

                const RewardBox = () => (
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
                      claimed ? "border-transparent" : claimable ? "" : isNext ? "" : light ? "border-[#E2E8F0] bg-[#F8FAFC]" : "border-white/10 bg-[#0F172A]"
                    }`}
                    style={{
                      backgroundColor: claimed ? BLUE : claimable ? `${BLUE}15` : isNext ? `${BLUE}15` : undefined,
                      borderColor: claimable || isNext ? BLUE : undefined,
                      boxShadow: claimed ? `0 4px 12px ${BLUE}40` : claimable || isNext ? `0 4px 12px ${BLUE}25` : undefined,
                    }}
                  >
                    {claimed ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : claimable ? (
                      <button
                        onClick={handleClaim}
                        className="w-full h-full flex flex-col items-center justify-center rounded-lg font-bold text-[10px] active:scale-95 transition-transform"
                        style={{ color: BLUE }}
                      >
                        Claim
                      </button>
                    ) : isNext ? (
                      <RewardVisual className="w-5 h-5 sm:w-6 sm:h-6" color={rewardColor} />
                    ) : (
                      <LockIcon className="w-4 h-4" color={light ? "#94A3B8" : "rgba(255,255,255,0.3)"} />
                    )}
                  </div>
                );

                return (
                  <div
                    key={reward.level}
                    className="relative flex flex-col items-center shrink-0 w-20 sm:w-24"
                  >
                    {/* Top: visual if above, else spacer */}
                    <div className="h-16 sm:h-20 flex flex-col items-center justify-end pb-2">
                      {above ? (
                        <>
                          <RewardBox />
                          <p className={`text-[10px] sm:text-xs font-bold mt-1 text-center leading-tight ${claimed ? text : claimable ? text : isNext ? text : textFaint}`}>{reward.label}</p>
                          <p className={`text-[9px] font-semibold ${textFaint}`}>Lvl {reward.level}</p>
                        </>
                      ) : null}
                    </div>

                    {/* Center: point on the line */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 shrink-0 z-10 flex items-center justify-center ${
                        claimed ? "border-transparent" : claimable || isNext ? "" : light ? "border-[#CBD5E1] bg-white" : "border-white/20 bg-[#1E293B]"
                      }`}
                      style={{
                        backgroundColor: claimed ? BLUE : claimable || isNext ? BLUE : undefined,
                        borderColor: claimable || isNext ? BLUE : undefined,
                      }}
                    />

                    {/* Bottom: visual if below, else spacer */}
                    <div className="h-16 sm:h-20 flex flex-col items-center justify-start pt-2">
                      {!above ? (
                        <>
                          <p className={`text-[9px] font-semibold ${textFaint}`}>Lvl {reward.level}</p>
                          <p className={`text-[10px] sm:text-xs font-bold text-center leading-tight ${claimed ? text : claimable ? text : isNext ? text : textFaint}`}>{reward.label}</p>
                          <div className="mt-1">
                            <RewardBox />
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
