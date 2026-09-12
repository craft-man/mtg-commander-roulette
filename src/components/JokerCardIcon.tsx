interface JokerCardIconProps {
  className?: string;
  size?: number;
}

export function JokerCardIcon({ className = "", size = 26 }: JokerCardIconProps) {
  return (
    <svg
      className={["joker-card-icon", className].filter(Boolean).join(" ")}
      width={size}
      height={size}
      viewBox="1 1 22 22"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect className="joker-card-shadow" x="4.25" y="2.4" width="17" height="20.1" rx="2.35" />
      <rect className="joker-card-paper" x="3.25" y="1.5" width="17.5" height="21" rx="2.5" />
      <path className="joker-card-outline" d="M18.25 1.5H5.75a2.5 2.5 0 0 0-2.5 2.5v16a2.5 2.5 0 0 0 2.5 2.5h12.5a2.5 2.5 0 0 0 2.5-2.5V4a2.5 2.5 0 0 0-2.5-2.5Z" />
      <path className="joker-corner-star" d="m5.65 3.25.42.86.95.14-.69.67.17.95-.85-.45-.84.45.16-.95-.68-.67.94-.14Z" />
      <path className="joker-corner-star" d="m18.35 18.15.42.86.95.14-.69.67.17.95-.85-.45-.84.45.16-.95-.68-.67.94-.14Z" />
      <path className="joker-hat-red" d="M10.85 10.05C9.25 7.1 7.15 6.95 5.7 8.75c1.7-.65 2.65.6 2.65 2.25Z" />
      <path className="joker-hat-gold" d="m10.55 9.45 1.45-4.8 1.45 4.8-1.45 1.4Z" />
      <path className="joker-hat-teal" d="M13.15 10.05c1.6-2.95 3.7-3.1 5.15-1.3-1.7-.65-2.65.6-2.65 2.25Z" />
      <circle className="joker-pom-red" cx="5.55" cy="9.15" r="1" />
      <circle className="joker-pom-gold" cx="12" cy="4.45" r="1" />
      <circle className="joker-pom-teal" cx="18.45" cy="9.15" r="1" />
      <path className="joker-collar" d="M8.45 9.55c2.35-1.25 4.75-1.25 7.1 0v4.85c.2 1.4 1 2.25 2.4 2.75-1.35.75-2.6.55-3.7-.65.2 1.35.8 2.35 1.8 3-1.7.15-3.05-.7-4.05-2.2-1 1.5-2.35 2.35-4.05 2.2 1-.65 1.6-1.65 1.8-3-1.1 1.2-2.35 1.4-3.7.65 1.4-.5 2.2-1.35 2.4-2.75Z" />
      <path className="joker-face-fill" d="M9.55 10.35c1.6-.65 3.3-.65 4.9 0v2.85c0 1.75-1 2.9-2.45 2.9s-2.45-1.15-2.45-2.9Z" />
      <path className="joker-face-detail" d="m10.35 12.15.9.55m-.9 0 .9-.55m1.5 0 .9.55m-.9 0 .9-.55M10.85 14.25c.75.55 1.55.55 2.3 0" />
    </svg>
  );
}
