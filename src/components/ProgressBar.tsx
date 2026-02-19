"use client";

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: string;
  showLabel?: boolean;
  label?: string;
}

export default function ProgressBar({
  value,
  color = "#3B82F6",
  height = "h-3",
  showLabel = false,
  label,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-[#64748B] mb-1.5 font-semibold">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className={`w-full ${height} rounded-full overflow-hidden bg-[#E2E8F0]`}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
