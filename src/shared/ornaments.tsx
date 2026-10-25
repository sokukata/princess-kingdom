// Decorative drawings, hidden from screen readers.

export function Crown({ size = 28 }: { size?: number }) {
  return (
    <svg className="crown-icon" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="crown-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6dc8c" />
          <stop offset="1" stopColor="#c2962c" />
        </linearGradient>
      </defs>
      <path d="M4 23 6 9l6.5 7L16 5l3.5 11L26 9l2 14z" fill="url(#crown-gold)" stroke="#8a6512" strokeLinejoin="round" />
      <rect x="4" y="23" width="24" height="4" rx="1.5" fill="#c2962c" stroke="#8a6512" />
      <circle cx="16" cy="25" r="1.4" fill="#d6336c" />
      <circle cx="10" cy="25" r="1" fill="#f6dc8c" />
      <circle cx="22" cy="25" r="1" fill="#f6dc8c" />
    </svg>
  )
}

export function Rose({ size = 28 }: { size?: number }) {
  return (
    <svg className="rose-icon" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 31V17" stroke="#2f6b3a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 25c-3.5 0-6-2.5-6.5-4.5 3 0 5.5 1.5 6.5 4.5z" fill="#3f8a4c" />
      <path d="M16 22c3.5 0 6-2.5 6.5-4.5-3 0-5.5 1.5-6.5 4.5z" fill="#3f8a4c" />
      <path d="M9 10c0-4 3.5-7 7-7s7 3 7 7c0 4.5-3 8-7 8s-7-3.5-7-8z" fill="#b0174f" />
      <path
        d="M12 9.5c1-2.5 3-3.5 5-3s3.5 2.5 3 4.5c-.5 2.5-3 4-5.5 3.5"
        fill="none"
        stroke="#7d0f38"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path d="M14.5 10c.5-1.2 1.6-1.6 2.5-1.2s1.2 1.6.6 2.4" fill="none" stroke="#7d0f38" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

// A thin line with a rose in the middle, to separate a title from what follows.
export function RoseDivider() {
  return (
    <div className="rose-divider" aria-hidden="true">
      <span />
      <Rose size={26} />
      <span />
    </div>
  )
}
