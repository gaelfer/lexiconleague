interface DiamondIconProps {
  className?: string;
  color?: string;
}

export default function DiamondIcon({ className = "w-6 h-6", color = "currentColor" }: DiamondIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 8L7 12L9 16L12 17L15 16L17 12L15 8L12 7L9 8Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 16L6.5 19" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 16L17.5 19" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 3V7" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 8L7 5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 8L17 5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 21V17" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="9" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 12H3" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12H17" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
