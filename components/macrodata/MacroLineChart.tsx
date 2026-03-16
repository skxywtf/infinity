'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const recessionPlugin = {
  id: 'recessionBars',
  beforeDraw: (chart: any, args: any, options: any) => {
    const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
    const recessionData = options.data;
    const labels = chart.data.labels;
    
    if (!recessionData || recessionData.length === 0 || !labels || labels.length === 0) return;

    // MAGIC FIX: Create a fast lookup Set of "YYYY-MM" strings for months that are in a recession
    // This allows monthly NBER data to perfectly align with daily Yield Curve data!
    const recessionMonths = new Set(
      recessionData
        .filter((r: any) => r.value === 1)
        .map((r: any) => r.time.substring(0, 7))
    );

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; 

    let isRecession = false;
    let startX: number | null = null;

    labels.forEach((label: string) => {
      const monthPrefix = label.substring(0, 7); // Extracts "YYYY-MM"
      const currentlyInRecession = recessionMonths.has(monthPrefix);
      
      const currentX = x.getPixelForValue(label);

      if (currentlyInRecession && !isRecession) {
        // A recession just started
        startX = currentX;
        isRecession = true;
      } else if (!currentlyInRecession && isRecession) {
        // A recession just ended
        if (startX !== null) {
          const width = Math.max(currentX - startX, 2);
          ctx.fillRect(startX, top, width, bottom - top);
        }
        startX = null;
        isRecession = false;
      }
    });

    // If the chart's data ends while we are still currently in a recession
    if (isRecession && startX !== null) {
      const endX = x.getPixelForValue(labels[labels.length - 1]);
      const width = Math.max(endX - startX, 2);
      ctx.fillRect(startX, top, width, bottom - top);
    }

    ctx.restore();
  }
};

interface MacroLineChartProps {
  seriesId: string;
  recessionData?: any[]; 
}

export default function MacroLineChart({ seriesId, recessionData = [] }: MacroLineChartProps) {
  const [transform, setTransform] = useState<'level' | 'yoy'>('level');
  const [chartData, setChartData] = useState<{ time: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch main chart data
  useEffect(() => {
    setLoading(true);
    fetch(`/api/data/${seriesId}`)
      .then(res => res.json())
      .then(data => {
        const formattedData = data.map((d: any) => ({
          time: d.date,
          value: d.value
        }));
        setChartData(formattedData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching chart data:", err);
        setLoading(false);
      });
  }, [seriesId]);

  // 2. Calculate YoY Data
  const transformedData = useMemo(() => {
    if (transform === 'level') return chartData;
    
    return chartData.map((point, i) => {
      const prevYearIndex = i - 12; // Assuming monthly data spacing
      if (prevYearIndex < 0) return { ...point, value: null };
      const prevValue = chartData[prevYearIndex].value;
      const yoy = ((point.value / prevValue) - 1) * 100;
      return { ...point, value: parseFloat(yoy.toFixed(2)) };
    }).filter(p => p.value !== null);
  }, [chartData, transform]);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-slate-400" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>Loading {seriesId}...</div>;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    // THE FIX: Animation is turned back on naturally by removing the line that disabled it!
    normalized: true, // PERFORMANCE BOOST: We keep this! Tells Chart.js data is already sorted, saving heavy calculations
    layout: {
      padding: {
        right: 50 
      }
    },
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: '#1b2226',
        titleColor: '#888',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y}${transform === 'yoy' ? '%' : ''}`
        }
      },
      recessionBars: { data: recessionData } 
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#444', maxTicksLimit: 6 } },
      y: { grid: { color: '#1b2226' }, ticks: { color: '#888' } }
    }
  };

  const data = {
    labels: transformedData.map(d => d.time) || [],
    datasets: [{
      label: seriesId,
      data: transformedData.map(d => d.value),
      borderColor: '#fccb0b',
      borderWidth: 3, 
      pointRadius: 0,
      tension: 0.1,
    }]
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <div style={{ display: 'flex', background: '#1b2226', borderRadius: '6px', padding: '2px' }}>
          <button 
            onClick={() => setTransform('level')}
            style={{ padding: '4px 8px', fontSize: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: transform === 'level' ? '#333' : 'transparent', color: '#fff' }}
          >LEVEL</button>
          <button 
            onClick={() => setTransform('yoy')}
            style={{ padding: '4px 8px', fontSize: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: transform === 'yoy' ? '#333' : 'transparent', color: '#fff' }}
          >YoY %</button>
        </div>
      </div>
      <div style={{ height: 'calc(100% - 35px)' }}>
        <Line options={options as any} data={data} plugins={[recessionPlugin]} />
      </div>
    </div>
  );
}