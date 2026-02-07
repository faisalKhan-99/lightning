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
    <div className="card-cyber p-4">
      <h3 className="label-mono mb-3">Supply vs Demand (kWh)</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2235" />
          <XAxis type="number" stroke="#3b4f6e" tick={{ fontSize: 10, fill: '#5a6a80' }} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#3b4f6e"
            tick={{ fontSize: 11, fill: '#5a6a80' }}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#131820',
              border: '1px solid #253045',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#e8ecf4',
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
