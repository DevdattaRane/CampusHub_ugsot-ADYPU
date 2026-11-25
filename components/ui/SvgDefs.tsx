export default function SvgDefs() {
  return (
    <svg className="svg-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lqg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#405CFF" />
          <stop offset=".35" stopColor="#B8E5CF" />
          <stop offset=".65" stopColor="#FF7048" />
          <stop offset="1" stopColor="#405CFF" />
          <animateTransform attributeName="gradientTransform" type="rotate" from="0 .5 .5" to="360 .5 .5" dur="9s" repeatCount="indefinite" />
        </linearGradient>
        <filter id="lqf" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency=".02 .03" numOctaves="2" seed="3">
            <animate attributeName="baseFrequency" values=".02 .03;.035 .02;.02 .03" dur="8s" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="5" />
        </filter>
        <filter id="lgf">
          <feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="18" />
        </filter>
      </defs>
    </svg>
  );
}
