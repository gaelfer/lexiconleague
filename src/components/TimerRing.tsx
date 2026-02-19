"use client";

interface TimerRingProps {
  timeLeft: number;
  totalTime: number;
}

export default function TimerRing({ timeLeft, totalTime }: TimerRingProps) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / totalTime;
  const offset = circumference * (1 - progress);

  const isUrgent = timeLeft <= 10;
  const color = isUrgent ? "#EF4444" : timeLeft <= 20 ? "#34D399" : "#3B82F6";

  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s ease" }}
        />
      </svg>
      <span
        className={`relative z-10 text-lg font-extrabold tabular-nums ${
          isUrgent ? "text-[#EF4444]" : "text-[#0F172A]"
        }`}
      >
        {timeLeft}
      </span>
    </div>
  );
}
