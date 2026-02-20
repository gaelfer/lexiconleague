export default function FlameIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={color}>
      <path
        fillRule="evenodd"
        d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.498A9.75 9.75 0 0016.5 13.5a9.75 9.75 0 01-9.75 9.75.75.75 0 01-.75-.75v-4.133a.75.75 0 00-.75-.75A3.375 3.375 0 016.648 6.61a7.547 7.547 0 011.744-1.959 9.742 9.742 0 00-3.539-6.177.75.75 0 00-1.071.136 9.75 9.75 0 0010.5 14.25.75.75 0 01.75.75v4.133a.75.75 0 00.75.75 9.75 9.75 0 0010.5-14.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}
