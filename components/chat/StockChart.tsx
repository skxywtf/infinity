'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock Data for Demo - In production this would come from props
const mockData = [
    { time: '9:30', price: 420.50 },
    { time: '10:00', price: 422.30 },
    { time: '10:30', price: 421.10 },
    { time: '11:00', price: 423.80 },
    { time: '11:30', price: 425.40 },
    { time: '12:00', price: 424.20 },
    { time: '12:30', price: 426.50 },
    { time: '13:00', price: 428.10 },
    { time: '13:30', price: 427.60 },
    { time: '14:00', price: 429.30 },
];

export default function StockChart({ ticker, data }: { ticker: string; data?: any[] }) {
    const chartData = data || mockData;
    const lastPrice = chartData[chartData.length - 1].price;
    const firstPrice = chartData[0].price;
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;
    const isPositive = change >= 0;

    return (
        <div className="w-full h-64 bg-black/20 rounded-xl p-4 border border-white/5 my-3 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`} />
                    <h3 className="text-sm font-bold text-white tracking-wide">{ticker} <span className="text-white/40 font-normal">Intraday</span></h3>
                </div>
                <div className="text-right">
                    <div className="text-lg font-mono font-bold text-white">${lastPrice.toFixed(2)}</div>
                    <div className={`text-xs font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{change.toFixed(2)}%
                    </div>
                </div>
            </div>
            <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis
                        dataKey="time"
                        tick={{ fill: '#ffffff40', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fill: '#ffffff40', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                        orientation="right"
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#060914', borderColor: '#ffffff10', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                    />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke={isPositive ? "#22c55e" : "#ef4444"}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
