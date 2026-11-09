import { cn } from "@/lib/utils";

/**
 * The picture side of a login page: angular glass panels, after the architectural photo in the design the
 * client chose, drawn in SVG so it is sharp on every screen and each portal can tint it. Pass the portal's
 * gradient (Tailwind `bg-gradient-to-br from-… via-… to-…`). Decorative only.
 */
export function GlassBackdrop({ gradient }: { gradient: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br", gradient)}>
      <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <g fill="#ffffff">
          <polygon points="0,0 260,0 140,260" opacity="0.07" />
          <polygon points="260,0 520,0 380,300 140,260" opacity="0.11" />
          <polygon points="520,0 800,0 800,180 380,300" opacity="0.05" />
          <polygon points="140,260 380,300 300,600 0,600 0,420" opacity="0.09" />
          <polygon points="380,300 800,180 800,420 560,600 300,600" opacity="0.13" />
          <polygon points="0,0 140,260 0,420" opacity="0.04" />
          <polygon points="560,600 800,420 800,600" opacity="0.06" />
          <polygon points="420,120 520,0 600,90 470,210" opacity="0.08" />
        </g>
        <g fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1.2">
          <path d="M0 0 L140 260 L380 300 L800 180" />
          <path d="M260 0 L140 260 L0 420" />
          <path d="M520 0 L380 300 L300 600" />
          <path d="M380 300 L560 600" />
          <path d="M600 90 L470 210 L380 300" />
        </g>
        {/* Window grid on the panels, as on a glass facade. */}
        <g stroke="#ffffff" strokeOpacity="0.07" strokeWidth="1">
          {Array.from({ length: 14 }, (_, i) => (
            <line key={`v${i}`} x1={420 + i * 28} y1={260 - i * 6} x2={360 + i * 30} y2={600} />
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`h${i}`} x1={380} y1={330 + i * 32} x2={800} y2={210 + i * 32} />
          ))}
        </g>
      </svg>
      {/* Darkens the bottom-left corner so the headline stays readable over the panels. */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/45 via-black/10 to-transparent" />
    </div>
  );
}
