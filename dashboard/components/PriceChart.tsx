'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface Props {
  priceHistory: { time: string; price: number; simHour: number }[];
}

export default function PriceChart({ priceHistory }: Props) {
  // Show last 100 data points
  const data = priceHistory.slice(-100);

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">ENERGY PRICE (SOL/kWh)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="time"
            stroke="#6B7280"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#6B7280"
            tick={{ fontSize: 10 }}
            domain={[0, 0.5]}
            tickFormatter={(v: number) => v.toFixed(2)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value) => [`${Number(value ?? 0).toFixed(4)} SOL`, 'Price']}
          />
          <ReferenceLine y={0.1} stroke="#6B7280" strokeDasharray="3 3" label="" />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#34D399"
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
