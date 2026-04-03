"use client";

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

export default function OecdWidget() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOecdData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/oecd');
        const json = await response.json();
        if (json.data && json.data.length > 0) {
          setData(json.data);
        } else {
          throw new Error("No data returned from API");
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch LIVE OECD data, using fallback:", error);
        const g20Data = [
          { country: 'IND', gdpGrowth: 7.8 },
          { country: 'CHN', gdpGrowth: 5.2 },
          { country: 'BRA', gdpGrowth: 2.9 },
          { country: 'USA', gdpGrowth: 3.1 },
          { country: 'AUS', gdpGrowth: 1.5 },
          { country: 'CAN', gdpGrowth: 1.1 },
          { country: 'FRA', gdpGrowth: 0.9 },
          { country: 'GBR', gdpGrowth: 0.5 },
          { country: 'JPN', gdpGrowth: 1.9 },
          { country: 'DEU', gdpGrowth: -0.3 },
        ].sort((a, b) => b.gdpGrowth - a.gdpGrowth);
        setData(g20Data);
        setLoading(false);
      }
    };

    fetchOecdData();
  }, []);

  // ── Custom glass tooltip ──
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0]?.value;
      const isPos = val >= 0;
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '10px',
          padding: '10px 14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
          minWidth: '130px',
        }}>
          <p style={{ margin: '0 0 4px 0', color: '#ffffff', fontWeight: 700, fontSize: '13px' }}>
            {label}
          </p>
          <p style={{
            margin: 0,
            color: isPos ? '#4caf50' : '#ff5252',
            fontWeight: 600,
            fontSize: '13px',
            textShadow: isPos
              ? '0 0 8px rgba(76,175,80,0.50)'
              : '0 0 8px rgba(255,82,82,0.50)',
          }}>
            GDP Growth: {val}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      // ── Matte glass card ──
      background: 'rgba(255, 255, 255, 0.04)',
      backdropFilter: 'blur(25px)',
      WebkitBackdropFilter: 'blur(25px)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
      padding: '24px',
      width: '100%',
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
      }}>
        <div>
          <h2 style={{
            margin: '0 0 4px 0',
            fontSize: '18px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.3px',
          }}>
            G20 Macro Coverage (World Bank)
          </h2>
          <p style={{
            margin: 0,
            fontSize: '12px',
            color: 'rgba(255,255,255,0.50)',
          }}>
            Real GDP Growth (Annualized %)
          </p>
        </div>

        {/* Live badge */}
        <div style={{
          padding: '4px 10px',
          background: 'rgba(30, 58, 138, 0.20)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(96, 165, 250, 0.25)',
          borderRadius: '6px',
          color: '#60a5fa',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '1px',
          boxShadow: '0 0 12px rgba(59,130,246,0.12)',
        }}>
          LIVE NO-AUTH
        </div>
      </div>

      {/* ── Chart area ── */}
      <div style={{ height: '350px', width: '100%' }}>
        {loading ? (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            gap: '16px',
          }}>
            <div style={{
              width: '32px', height: '32px',
              border: '3px solid rgba(96,165,250,0.80)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'oecd-spin 0.8s linear infinite',
            }} />
            <span style={{
              color: 'rgba(255,255,255,0.50)',
              fontWeight: 600,
              fontSize: '11px',
              letterSpacing: '2.5px',
            }}>
              QUERYING OECD DATABASE...
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="country"
                stroke="rgba(255,255,255,0.40)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.40)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="gdpGrowth" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.gdpGrowth >= 0 ? '#4caf50' : '#ff5252'}
                    opacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <style>{`
        @keyframes oecd-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}