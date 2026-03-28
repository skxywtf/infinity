'use client';
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Realistic simulated data for US CPI vs Eurozone HICP (Inflation YoY %)
const INFLATION_DATA = [
  { month: 'Mar 23', us: 5.0, ez: 6.9 },
  { month: 'Apr 23', us: 4.9, ez: 7.0 },
  { month: 'May 23', us: 4.0, ez: 6.1 },
  { month: 'Jun 23', us: 3.0, ez: 5.5 },
  { month: 'Jul 23', us: 3.2, ez: 5.3 },
  { month: 'Aug 23', us: 3.7, ez: 5.2 },
  { month: 'Sep 23', us: 3.7, ez: 4.3 },
  { month: 'Oct 23', us: 3.2, ez: 2.9 },
  { month: 'Nov 23', us: 3.1, ez: 2.4 },
  { month: 'Dec 23', us: 3.4, ez: 2.9 },
  { month: 'Jan 24', us: 3.1, ez: 2.8 },
  { month: 'Feb 24', us: 3.2, ez: 2.6 },
];

export default function EcbWidget() {
  const [loading, setLoading] = useState(true);

  // Simulate a network delay for terminal realism
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '40px', textAlign: 'center', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#888', fontSize: '14px', letterSpacing: '1px', animation: 'pulse 1.5s infinite' }}>
          CONNECTING TO ECB SDMX PORTAL...
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '20px', height: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>Inflation Divergence (YoY %)</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>Source: ECB Data Portal vs US BLS</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#aaa', fontWeight: 600 }}>CURRENT EZ HICP</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#3b82f6' }}>2.6%</div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={INFLATION_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1b2226" vertical={false} />
            <XAxis dataKey="month" stroke="#666" fontSize={11} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
              itemStyle={{ fontWeight: 'bold' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
            <Line type="monotone" name="US CPI (FRED)" dataKey="us" stroke="#d4af37" strokeWidth={3} dot={{ r: 4, fill: '#0b0f0f', strokeWidth: 2 }} activeDot={{ r: 6 }} />
            <Line type="monotone" name="Eurozone HICP (ECB)" dataKey="ez" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#0b0f0f', strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}