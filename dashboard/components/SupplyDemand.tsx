'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Props {
  supply: number;
  demand: number;
}

export default function SupplyDemand({ supply, demand }: Props) {
  const data = [
    { name: 'Supply', value: supply, color: '#34D399' },
    { name: 'Demand', value: demand, color: '#F87171' },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">SUPPLY vs DEMAND (kWh)</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" stroke="#6B7280" tick={{ fontSize: 10 }} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#6B7280"
            tick={{ fontSize: 11 }}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value) => [`${Number(value ?? 0).toFixed(2)} kWh`]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
