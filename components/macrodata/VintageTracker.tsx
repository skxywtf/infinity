"use client";
import React, { useState } from 'react';

// --- NEW: We add a prop so we can send data up to the AI ---
interface VintageTrackerProps {
  onDataFetched?: (data: any) => void;
}

export default function VintageTracker({ onDataFetched }: VintageTrackerProps) {
  const [seriesId, setSeriesId] = useState('GDP');
  const [vintageDate, setVintageDate] = useState('2020-04-29');
  const [vintageData, setVintageData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchVintage = async () => {
    setIsLoading(true);
    setError('');
    setVintageData([]);

    try {
      const response = await fetch(`/api/vintage/${seriesId}?date=${vintageDate}`);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        if (onDataFetched) onDataFetched(null); // Clear AI data on error
      } else {
        const revData = data.reverse();
        setVintageData(revData);
        
        // --- NEW: Package the data and send it up to the AI ---
        if (onDataFetched) {
          onDataFetched({
            title: `ALFRED Vintage Data Snapshot for ${seriesId}`,
            source: `ALFRED (Snapshot taken on ${vintageDate})`,
            series_id: seriesId,
            description: `This is historical unrevised data exactly as it looked on ${vintageDate}.`,
            data_values: revData.slice(0, 15) // We send the top 15 rows to the AI so it can read the numbers!
          });
        }
      }
    } catch (err) {
      setError("Failed to connect to the server.");
      if (onDataFetched) onDataFetched(null); // Clear AI data on error
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{ background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '30px', textAlign: 'left' }}>
      <h2 style={{ color: '#d4af37', margin: '0 0 10px 0' }}>ALFRED Vintage Data Tracker</h2>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '30px' }}>
        Select an economic indicator and a historical date to see exactly what the data looked like on that specific day, before any government revisions.
      </p>

      {/* --- INPUT CONTROLS --- */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', color: '#aaa', fontWeight: 'bold' }}>Economic Indicator</label>
          <select 
            value={seriesId} 
            onChange={(e) => setSeriesId(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', background: '#1b2226', color: '#fff', border: '1px solid #333', outline: 'none' }}
          >
            <option value="GDP">Real GDP (Quarterly)</option>
            <option value="CPIAUCSL">CPI Inflation (Monthly)</option>
            <option value="PAYEMS">Nonfarm Payrolls / Jobs (Monthly)</option>
            <option value="UNRATE">Unemployment Rate (Monthly)</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', color: '#aaa', fontWeight: 'bold' }}>Vintage Date (Snapshot)</label>
          <input 
            type="date" 
            value={vintageDate}
            onChange={(e) => setVintageDate(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', background: '#1b2226', color: '#fff', border: '1px solid #333', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <button 
            onClick={fetchVintage}
            disabled={isLoading}
            style={{ padding: '10px 20px', borderRadius: '8px', background: '#d4af37', color: '#000', border: 'none', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? 'Fetching Data...' : 'Get Vintage Print'}
          </button>
        </div>
      </div>

      {/* --- ERROR MESSAGE --- */}
      {error && (
        <div style={{ padding: '15px', background: '#ff525222', color: '#ff5252', borderRadius: '8px', border: '1px solid #ff525255', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* --- DATA DISPLAY --- */}
      {vintageData.length > 0 && (
        <div style={{ background: '#111518', borderRadius: '8px', border: '1px solid #1b2226', overflow: 'hidden' }}>
          <div style={{ padding: '15px', background: '#1b2226', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#aaa', fontSize: '14px' }}>
            <span>Observation Date</span>
            <span>Reported Value</span>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {vintageData.slice(0, 50).map((row, index) => (
              <div key={index} style={{ padding: '12px 15px', borderBottom: '1px solid #1b2226', display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: index === 0 ? '#d4af37' : '#fff', fontWeight: index === 0 ? 'bold' : 'normal' }}>
                <span>{row.date}</span>
                <span>{row.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: '#666', borderTop: '1px solid #1b2226' }}>
            Showing the 50 most recent observations prior to {vintageDate}
          </div>
        </div>
      )}
    </div>
  );
}