'use client';

import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';

interface Props {
  priceHistory: { time: string; price: number; simHour: number }[];
}

export default function PriceChart({ priceHistory }: Props) {
  const data = priceHistory.slice(-100);

  return (
    <div className="card-cyber p-4">
      <h3 className="label-mono mb-3">Energy Price (SOL/kWh)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2235" />
          <XAxis
            dataKey="time"
            stroke="#3b4f6e"
            tick={{ fontSize: 10, fill: '#5a6a80' }}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#3b4f6e"
            tick={{ fontSize: 10, fill: '#5a6a80' }}
            domain={[0, 0.5]}
            tickFormatter={(v: number) => v.toFixed(2)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#131820',
              border: '1px solid #253045',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#e8ecf4',
            }}
            formatter={(value) => [`${Number(value ?? 0).toFixed(4)} SOL`, 'Price']}
          />
          <ReferenceLine y={0.1} stroke="#3b4f6e" strokeDasharray="3 3" label="" />
          <Area
            type="monotone"
            dataKey="price"
            fill="url(#priceGradient)"
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#34D399"
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
