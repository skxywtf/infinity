'use client';  

import React, { useState, useEffect, useMemo } from 'react';  
import {  
  Chart as ChartJS, CategoryScale, LinearScale,  
  PointElement, LineElement, Title, Tooltip, Legend, Filler,  
} from 'chart.js';  
import { Line } from 'react-chartjs-2';  

ChartJS.register(  
  CategoryScale, LinearScale, PointElement,  
  LineElement, Title, Tooltip, Legend, Filler,  
);  

const recessionPlugin = {  
  id: 'recessionBars',  
  beforeDraw: (chart: any, _args: any, options: any) => {  
    const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;  
    const recessionData = options.data;  
    const labels = chart.data.labels;  
    if (!recessionData?.length || !labels?.length) return;  

    const recessionMonths = new Set(  
      recessionData  
        .filter((r: any) => r.value === 1)  
        .map((r: any) => r.time.substring(0, 7)),  
    );  

    ctx.save();  
    ctx.fillStyle = 'rgba(128, 128, 128, 0.18)';  

    let isRecession = false;  
    let startX: number | null = null;  

    labels.forEach((label: string) => {  
      const monthPrefix = label.substring(0, 7);  
      const currentlyInRecession = recessionMonths.has(monthPrefix);  
      const currentX = x.getPixelForValue(label);  

      if (currentlyInRecession && !isRecession) {  
        startX = currentX;  
        isRecession = true;  
      } else if (!currentlyInRecession && isRecession) {  
        if (startX !== null) {  
          ctx.fillRect(startX, top, Math.max(currentX - startX, 2), bottom - top);  
        }  
        startX = null;  
        isRecession = false;  
      }  
    });  

    if (isRecession && startX !== null) {  
      const endX = x.getPixelForValue(labels[labels.length - 1]);  
      ctx.fillRect(startX, top, Math.max(endX - startX, 2), bottom - top);  
    }  

    ctx.restore();  
  },  
};  

interface MacroLineChartProps {  
  seriesId: string;  
  recessionData?: any[];  
}  

export default function MacroLineChart({ seriesId, recessionData = [] }: MacroLineChartProps) {  
  const [transform, setTransform]   = useState<'level' | 'yoy'>('level');  
  const [chartData, setChartData]   = useState<{ time: string; value: number }[]>([]);  
  const [loading, setLoading]       = useState(true);  

  useEffect(() => {  
    setLoading(true);  
    fetch(`/api/data/${seriesId}`)  
      .then(res => res.json())  
      .then(data => {  
        setChartData(data.map((d: any) => ({ time: d.date, value: d.value })));  
        setLoading(false);  
      })  
      .catch(err => { console.error("Error fetching chart data:", err); setLoading(false); });  
  }, [seriesId]);  

  const transformedData = useMemo(() => {  
    let processed = chartData;  

    if (transform === 'yoy') {  
      processed = chartData.map((point, i) => {  
        const prevIdx = i - 12;  
        if (prevIdx < 0) return { ...point, value: null as any };  
        const yoy = ((point.value / chartData[prevIdx].value) - 1) * 100;  
        return { ...point, value: parseFloat(yoy.toFixed(2)) };  
      }).filter(p => p.value !== null) as typeof chartData;  
    }  

    const MAX_POINTS = 600;  
    if (processed.length > MAX_POINTS) {  
      const step = Math.ceil(processed.length / MAX_POINTS);  
      processed = processed.filter((_, i) =>  
        i === 0 || i === processed.length - 1 || i % step === 0,  
      );  
    }  

    return processed;  
  }, [chartData, transform]);  

  if (loading) {  
    return (  
      <div style={{  
        display: 'flex',  
        alignItems: 'center',  
        justifyContent: 'center',  
        height: '100%',  
        color: 'rgba(255,255,255,0.25)',  
        fontSize: 12,  
        letterSpacing: '0.5px',  
      }}>  
        Loading {seriesId}...  
      </div>  
    );  
  }  

  const options = {  
    responsive: true,  
    maintainAspectRatio: false,  
    normalized: true,  
    layout: { padding: { right: 50 } },  
    interaction: { mode: 'index' as const, intersect: false },  
    plugins: {  
      legend: { display: false },  
      tooltip: {  
        enabled: true,  
        // ── Glass tooltip ──  
        backgroundColor: 'rgba(8,14,20,0.88)',  
        titleColor: 'rgba(255,255,255,0.45)',  
        bodyColor: '#fff',  
        borderColor: 'rgba(255,255,255,0.08)',  
        borderWidth: 1,  
        padding: 10,  
        cornerRadius: 8,  
        callbacks: {  
          label: (ctx: any) =>  
            `${ctx.dataset.label}: ${ctx.parsed.y}${transform === 'yoy' ? '%' : ''}`,  
        },  
      },  
      recessionBars: { data: recessionData },  
    },  
    scales: {  
      x: {  
        grid: { display: false },  
        ticks: { color: 'rgba(255,255,255,0.25)', maxTicksLimit: 6 },  
        border: { color: 'rgba(255,255,255,0.06)' },  
      },  
      y: {  
        grid: { color: 'rgba(255,255,255,0.04)' },  
        ticks: { color: 'rgba(255,255,255,0.35)' },  
        border: { color: 'rgba(255,255,255,0.06)' },  
      },  
    },  
  };  

  const data = {  
    labels: transformedData.map(d => d.time),  
    datasets: [{  
      label: seriesId,  
      data: transformedData.map(d => d.value),  
      borderColor: '#fccb0b',  
      borderWidth: 2.5,  
      pointRadius: 0,  
      tension: 0.1,  
    }],  
  };  

  return ( 
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}> 
      {/* ── Transform toggle ── */} 
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}> 
        <div style={{ 
          display: 'flex', 
          background: 'rgba(255, 255, 255, 0.05)', 
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '6px', 
          padding: '3px',
          gap: '2px'
        }}> 
          <button
            onClick={() => setTransform('level')}
            style={{
              background: transform === 'level' ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: transform === 'level' ? '#fff' : 'rgba(255,255,255,0.4)',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            LEVEL
          </button>
          <button
            onClick={() => setTransform('yoy')}
            style={{
              background: transform === 'yoy' ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: transform === 'yoy' ? '#fff' : 'rgba(255,255,255,0.4)',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            YOY %
          </button>
        </div> 
      </div> 

      {/* ── Chart Rendering ── */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Line data={data} options={options} plugins={[recessionPlugin]} />
      </div>
    </div> 
  ); 
}