export default function MicrosoftIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" rx="0.5" />
      <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00" rx="0.5" />
      <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF" rx="0.5" />
      <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" rx="0.5" />
    </svg>
  );
}
