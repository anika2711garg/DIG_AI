const SPARKS = [
  { left: "18%", top: "42%", delay: "0s" },
  { left: "32%", top: "28%", delay: "1.4s" },
  { left: "48%", top: "22%", delay: "0.6s" },
  { left: "63%", top: "30%", delay: "2.1s" },
  { left: "78%", top: "44%", delay: "1.1s" },
  { left: "24%", top: "58%", delay: "2.8s" },
  { left: "71%", top: "56%", delay: "0.3s" },
  { left: "41%", top: "48%", delay: "3.2s" },
];

export function HeroHorizon() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[92vh] overflow-hidden" aria-hidden>
      <div className="hero-horizon-glow" />
      <svg
        className="absolute left-1/2 top-[8%] h-[520px] w-[160%] -translate-x-1/2"
        viewBox="0 0 1200 420"
        fill="none"
      >
        <defs>
          <linearGradient id="arc-stroke" x1="0" y1="0" x2="1200" y2="0">
            <stop offset="0%" stopColor="rgba(59,130,246,0)" />
            <stop offset="28%" stopColor="rgba(96,165,250,0.55)" />
            <stop offset="50%" stopColor="rgba(186,230,253,0.95)" />
            <stop offset="72%" stopColor="rgba(96,165,250,0.55)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
          </linearGradient>
          <filter id="arc-blur" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <path
          d="M40 360 C 280 40, 920 40, 1160 360"
          stroke="url(#arc-stroke)"
          strokeWidth="2.2"
          filter="url(#arc-blur)"
          className="hero-arc-pulse"
        />
        <path d="M40 360 C 280 40, 920 40, 1160 360" stroke="url(#arc-stroke)" strokeWidth="1" opacity="0.9" />
        <circle r="3.5" fill="#E0F2FE" filter="url(#arc-blur)" className="hero-arc-dot" />
      </svg>

      <span className="hero-ray left-[22%]" style={{ animationDelay: "0s" }} />
      <span className="hero-ray left-[38%] h-[340px] opacity-70" style={{ animationDelay: "0.7s" }} />
      <span className="hero-ray left-[50%] h-[380px]" style={{ animationDelay: "1.2s" }} />
      <span className="hero-ray left-[62%] h-[340px] opacity-70" style={{ animationDelay: "1.8s" }} />
      <span className="hero-ray left-[78%] opacity-50" style={{ animationDelay: "0.4s" }} />

      {SPARKS.map((spark, i) => (
        <span
          key={i}
          className="hero-spark"
          style={{ left: spark.left, top: spark.top, animationDelay: spark.delay }}
        />
      ))}
    </div>
  );
}
