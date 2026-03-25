'use client';
import React, { useState } from 'react';

type Section = 'income' | 'balance' | 'cashflow';
const SECTION_LABELS: Record<Section,string> = {income:'Income Statement',balance:'Balance Sheet',cashflow:'Cash Flow'};
const HIGHLIGHT = new Set(['Revenue','Gross Profit','Operating Income','Net Income','EPS (Diluted)']);

function fmt(val: number|null|undefined, label: string): string {
  if(val===null||val===undefined||isNaN(val)) return '—';
  if(label==='EPS (Diluted)') return `$${val.toFixed(2)}`;
  const a=Math.abs(val);
  if(a>=1e9) return `$${(val/1e9).toFixed(1)}B`;
  if(a>=1e6) return `$${(val/1e6).toFixed(0)}M`;
  if(a>=1e3) return `$${(val/1e3).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}
function pct(curr:number|null|undefined,prev:number|null|undefined){
  if(!curr||!prev||prev===0) return null;
  const c=((curr-prev)/Math.abs(prev))*100;
  return `${c>=0?'+':''}${c.toFixed(1)}%`;
}

function Table({section,years,label}:{section:any;years:number[];label:string}){
  const rows=Object.entries(section);
  if(!rows.length) return null;
  return (
    <div style={{marginBottom:28}}>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:'#d4af37',marginBottom:10}}>{label.toUpperCase()}</div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead>
            <tr>
              <th style={{textAlign:'left',padding:'6px 8px',color:'#333',fontWeight:600,borderBottom:'1px solid #1b2226',width:180}}>Line Item</th>
              {years.map(yr=><th key={yr} style={{textAlign:'right',padding:'6px 8px',color:'#555',fontWeight:600,borderBottom:'1px solid #1b2226',minWidth:72}}>{yr}</th>)}
            </tr>
          </thead>
          <tbody>
            {(rows as any[]).map(([rowLabel,values])=>{
              const isKey=HIGHLIGHT.has(rowLabel);
              return (
                <tr key={rowLabel} style={{borderBottom:'1px solid #0c1010'}}>
                  <td style={{padding:'6px 8px',color:isKey?'#dde8e8':'#555',fontWeight:isKey?600:400}}>{rowLabel}</td>
                  {years.map((yr,i)=>{
                    const val=values[yr];const prev=i>0?values[years[i-1]]:null;
                    const ch=i>0?pct(val,prev):null;const pos=ch&&!ch.startsWith('-');
                    return(<td key={yr} style={{textAlign:'right',padding:'6px 8px'}}>
                      <div style={{fontWeight:isKey?700:400,color:isKey?'#fff':'#888'}}>{fmt(val,rowLabel)}</div>
                      {ch&&<div style={{fontSize:9,color:pos?'#4caf82':'#e05c5c',marginTop:1}}>{ch}</div>}
                    </td>);
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Fundamentals(){
  const [ticker,setTicker]=useState('');
  const [loading,setLoading]=useState(false);
  const [data,setData]=useState<any>(null);
  const [error,setError]=useState('');
  const [section,setSection]=useState<Section>('income');
  const [years,setYears]=useState(5);

  const lookup=async()=>{
    const t=ticker.trim().toUpperCase();if(!t)return;
    setLoading(true);setError('');setData(null);
    try{
      const res=await fetch(`/api/edgar/${t}?years=${years}`);
      const json=await res.json();
      if(!res.ok){setError(json.error||'Failed');return;}
      setData(json);
    }catch(e:unknown){setError(String(e));}
    finally{setLoading(false);}
  };

  const active=data?(section==='income'?data.incomeStatement:section==='balance'?data.balanceSheet:data.cashFlowStatement):null;

  return(
    <div style={{background:'#0b0f0f',border:'1px solid #1b2226',borderRadius:16,padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <div style={{fontSize:18,fontWeight:700,color:'#fff'}}>Fundamentals</div>
          <div style={{fontSize:10,color:'#333',marginTop:2,letterSpacing:1}}>SEC EDGAR · XBRL · ANNUAL 10-K</div>
        </div>
        {data&&<div style={{textAlign:'right'}}>
          <div style={{fontSize:14,fontWeight:700,color:'#fff'}}>{data.company.name}</div>
          <div style={{fontSize:10,color:'#4caf82',letterSpacing:1}}>{data.company.ticker} · CIK {data.company.cik}</div>
        </div>}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        <input value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&lookup()}
          placeholder="TICKER (AAPL · MSFT · NVDA · TSLA)"
          style={{flex:1,background:'#080c0c',border:'1px solid #1b2226',borderRadius:8,padding:'10px 14px',color:'#fff',fontSize:13,outline:'none',fontFamily:'monospace',letterSpacing:1}}/>
        <select value={years} onChange={e=>setYears(Number(e.target.value))}
          style={{background:'#080c0c',border:'1px solid #1b2226',borderRadius:8,padding:'10px',color:'#666',fontSize:12}}>
          {[3,5,7,10].map(y=><option key={y} value={y}>{y}Y</option>)}
        </select>
        <button onClick={lookup} disabled={loading}
          style={{background:loading?'#1b2226':'#d4af37',color:loading?'#444':'#000',border:'none',borderRadius:8,padding:'10px 20px',fontWeight:700,fontSize:12,cursor:loading?'not-allowed':'pointer',letterSpacing:1}}>
          {loading?'LOADING…':'PULL'}
        </button>
      </div>
      {error&&<div style={{color:'#e05c5c',fontSize:12,padding:'10px 14px',background:'#1a0808',borderRadius:8,marginBottom:16}}>{error}</div>}
      {loading&&<div style={{color:'#2a3a3a',fontSize:12,textAlign:'center',padding:40}}>Fetching SEC EDGAR data…</div>}
      {data&&!loading&&<>
        <div style={{display:'flex',gap:6,marginBottom:20,borderBottom:'1px solid #1b2226',paddingBottom:12}}>
          {(Object.keys(SECTION_LABELS) as Section[]).map(s=>(
            <button key={s} onClick={()=>setSection(s)} style={{background:section===s?'#1b2226':'transparent',
              color:section===s?'#d4af37':'#444',border:'1px solid',borderColor:section===s?'#d4af3733':'transparent',
              padding:'6px 14px',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer',letterSpacing:1}}>
              {SECTION_LABELS[s].toUpperCase()}
            </button>
          ))}
          <div style={{flex:1}}/>
          <div style={{fontSize:10,color:'#2a3a3a',alignSelf:'center'}}>FY {data.fiscalYears[0]}–{data.fiscalYears[data.fiscalYears.length-1]}</div>
        </div>
        {active&&<Table section={active} years={data.fiscalYears} label={SECTION_LABELS[section]}/>}
        {data.warnings.length>0&&<div style={{fontSize:10,color:'#1e2e2e',marginTop:8}}>Missing: {data.warnings.join(', ')}</div>}
      </>}
      {!data&&!loading&&!error&&<div style={{textAlign:'center',padding:'30px 0',color:'#1e2e2e',fontSize:12}}>Enter a ticker to pull SEC 10-K financials</div>}
    </div>
  );
}