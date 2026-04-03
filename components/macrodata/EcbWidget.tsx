'use client';
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function EcbWidget() {
  const [data, setData]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ecb')
      .then(res => res.json())
      .then(json => {
        if (json.data) setData(json.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch live ECB data', err);
        setLoading(false);
      });
  }, []);

  // ── Loading shell ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: 40,
        height: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          {/* Spinner */}
          <div style={{
            width: 28,
            height: 28,
            border: '2px solid rgba(96,165,250,0.80)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'ecb-spin 0.85s linear infinite',
          }} />
          <span style={{
            color: 'rgba(255,255,255,0.50)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '2px',
          }}>
            FETCHING LIVE DATA FROM ECB &amp; FRED…
          </span>
        </div>
        <style>{`@keyframes ecb-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const currentEzInflation = data.length > 0 ? data[data.length - 1].ez : 'N/A';

  // ── Main card ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.04)',
      backdropFilter: 'blur(25px)',
      WebkitBackdropFilter: 'blur(25px)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
      padding: 20,
      height: 400,
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Header ── */}
      <div style={{
        marginBottom: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.5px',
          }}>
            Inflation Divergence (YoY %)
          </h3>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: 12,
            color: 'rgba(255,255,255,0.50)',
          }}>
            Source: ECB Data Portal vs US BLS
          </p>
        </div>

        {/* EZ HICP badge */}
        <div style={{
          textAlign: 'right',
          background: 'rgba(59,130,246,0.08)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(96,165,250,0.25)',
          borderRadius: 10,
          padding: '8px 14px',
          boxShadow: '0 0 18px rgba(59,130,246,0.10)',
        }}>
          <div style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.50)',
            fontWeight: 700,
            letterSpacing: '1.5px',
            marginBottom: 3,
          }}>
            CURRENT EZ HICP
          </div>
          <div style={{
            fontSize: 22,
            fontWeight: 900,
            color: '#3b82f6',
            lineHeight: 1,
            textShadow: '0 0 14px rgba(59,130,246,0.55)',
          }}>
            {currentEzInflation}%
          </div>
        </div>
      </div>

      {/* ── Chart ── */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.07)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="rgba(255,255,255,0.30)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="rgba(255,255,255,0.30)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={val => `${val}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                borderColor: 'rgba(255,255,255,0.15)',
                borderRadius: 10,
                fontSize: 12,
                color: '#ffffff',
                boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
              }}
              itemStyle={{ fontWeight: 'bold' }}
            />
            <Legend
              wrapperStyle={{
                fontSize: 12,
                paddingTop: 10,
                color: 'rgba(255,255,255,0.60)',
              }}
              iconType="circle"
            />
            <Line
              type="monotone"
              name="US CPI (FRED)"
              dataKey="us"
              stroke="#d4af37"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: 'rgba(255,255,255,0.04)', strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              name="Eurozone HICP (ECB)"
              dataKey="ez"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: 'rgba(255,255,255,0.04)', strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}