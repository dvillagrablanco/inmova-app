'use client';

/**
 * SVG Radar Chart for opportunity comparison
 * 5 axes: Yield, Descuento, Riesgo (inverted), Liquidez, Potencial
 */

interface RadarData {
  label: string;
  color: string;
  values: number[]; // 5 values, 0-100
}

interface RadarChartProps {
  data: RadarData[];
  axes?: string[];
  size?: number;
}

export function RadarChart({ data, axes = ['Yield', 'Descuento', 'Riesgo⁻¹', 'Liquidez', 'Potencial'], size = 220 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const n = axes.length;
  const angleStep = (2 * Math.PI) / n;

  const getPoint = (value: number, index: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const dist = (value / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const gridLevels = [20, 40, 60, 80, 100];
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Grid */}
      {gridLevels.map(level => {
        const points = Array.from({ length: n }, (_, i) => {
          const p = getPoint(level, i);
          return `${p.x},${p.y}`;
        }).join(' ');
        return <polygon key={level} points={points} fill="none" stroke="#e5e7eb" strokeWidth={level === 100 ? 1.5 : 0.5} />;
      })}

      {/* Axis lines */}
      {axes.map((_, i) => {
        const p = getPoint(100, i);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#d1d5db" strokeWidth={0.5} />;
      })}

      {/* Data polygons */}
      {data.map((d, di) => {
        const points = d.values.map((v, i) => {
          const p = getPoint(v, i);
          return `${p.x},${p.y}`;
        }).join(' ');
        return (
          <g key={di}>
            <polygon points={points} fill={d.color || colors[di % colors.length]} fillOpacity={0.15} stroke={d.color || colors[di % colors.length]} strokeWidth={2} />
            {d.values.map((v, i) => {
              const p = getPoint(v, i);
              return <circle key={i} cx={p.x} cy={p.y} r={3} fill={d.color || colors[di % colors.length]} />;
            })}
          </g>
        );
      })}

      {/* Labels */}
      {axes.map((label, i) => {
        const p = getPoint(115, i);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" className="text-[9px] fill-current text-muted-foreground">
            {label}
          </text>
        );
      })}

      {/* Legend */}
      {data.map((d, i) => (
        <g key={i}>
          <rect x={5} y={size - 15 - i * 14} width={8} height={8} rx={2} fill={d.color || colors[i % colors.length]} />
          <text x={16} y={size - 8 - i * 14} className="text-[8px] fill-current text-muted-foreground">{d.label}</text>
        </g>
      ))}
    </svg>
  );
}
