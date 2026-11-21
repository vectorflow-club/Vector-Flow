// Inline SVG icons for the whole site. Every pictogram in the UI is
// one of these — no emoji, no text-glyph icons (arrows, crosses and
// the hamburger used to be characters). Stroke style follows the
// lucide/feather convention: 24x24 grid, 2px round stroke, sized by
// the surrounding font size (1em), coloured by currentColor, so an
// icon always matches the text next to it. All icons are
// aria-hidden: the visible label next to them carries the meaning.

function Icon({ children, className = "", filled = false }) {
  return (
    <svg
      className={`ui-icon ${className}`.trim()}
      aria-hidden="true"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={filled ? undefined : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function IconMenu({ className }) {
  return (
    <Icon className={className}>
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </Icon>
  );
}

export function IconClose({ className }) {
  return (
    <Icon className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Icon>
  );
}

export function IconCheck({ className }) {
  return (
    <Icon className={className}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  );
}

export function IconChevronDown({ className }) {
  return (
    <Icon className={className}>
      <polyline points="6 9 12 15 18 9" />
    </Icon>
  );
}

export function IconArrowLeft({ className }) {
  return (
    <Icon className={className}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </Icon>
  );
}

export function IconArrowRight({ className }) {
  return (
    <Icon className={className}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Icon>
  );
}

export function IconArrowDown({ className }) {
  return (
    <Icon className={className}>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </Icon>
  );
}

export function IconExternalLink({ className }) {
  return (
    <Icon className={className}>
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </Icon>
  );
}

export function IconCalendar({ className }) {
  return (
    <Icon className={className}>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </Icon>
  );
}

export function IconMapPin({ className }) {
  return (
    <Icon className={className}>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </Icon>
  );
}

export function IconCreditCard({ className }) {
  return (
    <Icon className={className}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </Icon>
  );
}

export function IconEye({ className }) {
  return (
    <Icon className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

export function IconDownload({ className }) {
  return (
    <Icon className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </Icon>
  );
}

export function IconClock({ className }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Icon>
  );
}

export function IconClipboardList({ className }) {
  return (
    <Icon className={className}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </Icon>
  );
}

export function IconGraduationCap({ className }) {
  return (
    <Icon className={className}>
      <path d="M21.42 10.922a1 1 0 0 0-.019 1.838L12.83 15.189a2 2 0 0 1-1.66 0L2.6 12.76a1 1 0 0 0 0-1.836l9.37-2.89a2 2 0 0 1 1.66 0z" />
      <path d="M22 10v6" />
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </Icon>
  );
}

export function IconScroll({ className }) {
  return (
    <Icon className={className}>
      <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4" />
      <path d="M19 17V5a2 2 0 0 0-2-2H4" />
    </Icon>
  );
}

export function IconEdit({ className }) {
  return (
    <Icon className={className}>
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      <path d="m15 5 4 4" />
    </Icon>
  );
}

export function IconSparkle({ className }) {
  return (
    <Icon className={className} filled>
      <path d="M12 2l2.1 7.9L22 12l-7.9 2.1L12 22l-2.1-7.9L2 12l7.9-2.1z" />
    </Icon>
  );
}
