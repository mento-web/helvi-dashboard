/* ============================================================================
   charts/sparkline.tsx — tiny KPI trend line.

   Plain SVG instead of Recharts so KPI tiles do not need client-side JS.
   ========================================================================== */

export function Sparkline({
  values,
  height = 42,
}: {
  values: number[];
  height?: number;
}) {
  const width = 180;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[42px] w-full overflow-visible"
      role="img"
      aria-label="Trend"
      preserveAspectRatio="none"
    >
      <path d={area} fill="hsl(var(--accent-raw) / 0.08)" />
      <path
        d={path}
        fill="none"
        stroke="hsl(var(--accent-raw))"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
