import type { ReactNode } from "react";

export function InkUnderline({ children }: { children: ReactNode }) {
  return (
    <span className="ink-underline">
      {children}
      <svg viewBox="0 0 220 12" fill="none" aria-hidden>
        <path
          d="M2 8.2 C 38 11.4, 72 3.1, 108 7.6 C 142 11.8, 176 4.2, 218 7.1"
          stroke="#60A5FA"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M8 9.6 C 54 6.2, 96 10.8, 148 8.1 C 178 6.4, 204 9.4, 214 8.8"
          stroke="#38BDF8"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.35"
        />
      </svg>
    </span>
  );
}
