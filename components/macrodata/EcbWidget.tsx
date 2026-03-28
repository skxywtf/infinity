'use client';
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function EcbWidget() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH THE LIVE DATA FROM OUR PYTHON BACKEND
  useEffect(() => {
    fetch('/api/ecb')
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          setData(json.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch live ECB data", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '40px', textAlign: 'center', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#888', fontSize: '14px', letterSpacing: '1px', animation: 'pulse 1.5s infinite' }}>
          FETCHING LIVE DATA FROM ECB & FRED...
        </div>
      </div>
    );
  }

  // Get the absolute latest Eurozone inflation number for the top right corner dynamically
  const currentEzInflation = data.length > 0 ? data[data.length - 1].ez : "N/A";

  return (
    <div className="card" style={{ background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '20px', height: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>Inflation Divergence (YoY %)</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>Source: ECB Data Portal vs US BLS</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#aaa', fontWeight: 600 }}>CURRENT EZ HICP</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#3b82f6' }}>{currentEzInflation}%</div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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