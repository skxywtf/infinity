'use client';
import React, { useEffect, useState } from 'react';

interface SkoreEntry { score: number; tag: 'Buy'|'Hold'|'Sell'|'Watch'; rationale: string; }
interface Brief { id: string; generated_at: string; brief_type: string; trigger_series: string; content_md: string; skore_json: Record<string,SkoreEntry>|string; regime_json: unknown; }

const TAG_STYLE: Record<string,{bg:string;color:string}> = {
  Buy:{bg:'rgba(76,175,130,0.12)',color:'#4caf82'},
  Sell:{bg:'rgba(224,92,92,0.12)',color:'#e05c5c'},
  Hold:{bg:'rgba(245,158,66,0.12)',color:'#f59e42'},
  Watch:{bg:'rgba(74,144,217,0.12)',color:'#4a90d9'},
};

export default function MacroBrief() {
  const [brief,setBrief]=useState<Brief|null>(null);
  const [loading,setLoading]=useState(true);
  const [generating,setGen]=useState(false);
  const [error,setError]=useState('');

  const fetchLatest=()=>{
    setLoading(true);
    fetch('/api/brief/latest')
      .then(r=>r.ok?r.json():Promise.reject(r.status))
      .then(d=>{setBrief(d);setLoading(false);})
      .catch(c=>{setLoading(false);setError(c===404?'No brief yet. Click Generate.':'Failed to load.');});
  };
  useEffect(()=>{fetchLatest();},[]);

  const generate=async()=>{
    setGen(true);setError('');
    try{
      const res=await fetch('/api/brief/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({trigger_series:'manual',brief_type:'daily'})});
      if(!res.ok) throw new Error('Failed');
      await fetchLatest();
    }catch(e:unknown){setError(e instanceof Error?e.message:'Failed');}
    setGen(false);
  };

  const skore=brief?(typeof brief.skore_json==='string'?JSON.parse(brief.skore_json):(brief.skore_json as Record<string,SkoreEntry>)||{}):{}; 

  return(
    <div style={{background:'#0b0f0f',border:'1px solid #1b2226',borderRadius:'16px',padding:'20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <h3 style={{margin:0,fontSize:'18px',color:'#fff'}}>WTF Macro Brief</h3>
        <button onClick={generate} disabled={generating} style={{padding:'8px 16px',border:'1px solid #d4af37',borderRadius:'8px',cursor:'pointer',background:'transparent',color:'#d4af37'}}>
          {generating?'GENERATING...':'GENERATE'}
        </button>
      </div>
      {error&&<div style={{color:'#f59e42',marginBottom:'12px'}}>{error}</div>}
      {loading&&!error&&<div style={{color:'#444'}}>Loading...</div>}
      {brief&&!loading&&(
        <>
          <div style={{fontSize:'13px',color:'#aababa',padding:'16px',background:'#080c0c',borderRadius:'10px',marginBottom:'16px',borderLeft:'3px solid #d4af37'}}>
            {brief.content_md}
          </div>
          {Object.keys(skore).length>0&&(
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {Object.entries(skore).map(([slug,entry])=>{
                const ts=TAG_STYLE[entry.tag]||TAG_STYLE['Watch'];
                return(<div key={slug} style={{padding:'12px 14px',borderRadius:'10px',background:'#080c0c',border:'1px solid #141e1e'}}>
                  <span style={{fontWeight:700,color:'#dde8e8'}}>{slug}</span>
                  <span style={{background:ts.bg,color:ts.color,padding:'3px 10px',borderRadius:'4px',marginLeft:'8px'}}>{entry.tag.toUpperCase()}</span>
                  <p style={{fontSize:'11px',color:'#5a7878',margin:'6px 0 0'}}>{entry.rationale}</p>
                </div>);
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
