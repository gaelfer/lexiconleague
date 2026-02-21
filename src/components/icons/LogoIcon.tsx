/** App favicon/logo — water droplet from casual mode, used for branding everywhere */
export default function LogoIcon({
  className = "w-10 h-10",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
      {...props}
    >
      <path d="M50 10C50 10 24 42 24 60C24 74.4 35.6 88 50 88C64.4 88 76 74.4 76 60C76 42 50 10 50 10z" fill="#3B82F6" />
      <ellipse cx="38" cy="52" rx="6" ry="8" fill="white" opacity="0.18" />
      <path d="M30 54Q37 46 44 54" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M56 54Q63 46 70 54" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="30" cy="60" rx="4" ry="2.5" fill="#FF9999" opacity="0.4" />
      <ellipse cx="70" cy="60" rx="4" ry="2.5" fill="#FF9999" opacity="0.4" />
      <path d="M40 65Q50 74 60 65" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
      {/* Glasses */}
      <circle cx="37" cy="54" r="11" fill="none" stroke="white" strokeWidth="2.5" opacity="0.9" />
      <circle cx="63" cy="54" r="11" fill="none" stroke="white" strokeWidth="2.5" opacity="0.9" />
      <path d="M48 54Q50 50 52 54" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      <line x1="26" y1="52" x2="22" y2="50" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="74" y1="52" x2="78" y2="50" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
