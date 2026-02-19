export default function InkDropIcon({
  className = "w-5 h-5",
  color = "#3B82F6",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2C12 2 5 10.5 5 15C5 18.866 8.134 22 12 22C15.866 22 19 18.866 19 15C19 10.5 12 2 12 2Z"
        fill={color}
      />
      <ellipse cx="9.5" cy="13" rx="2" ry="2.5" fill="white" opacity="0.3" />
    </svg>
  );
}
