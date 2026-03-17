'use client';
import React, { useEffect, useState } from 'react';

interface NewsItem {
  id: string;
  published_at: string;
  headline: string;
  summary: string | null;
  source: string;
  url: string;
  related_series: string[] | null;
}

interface WTFNewsFeedProps {
  seriesSlug?: string;
  maxItems?: number;
}

const SOURCE_COLORS: Record<string, string> = {
  BLS: '#4a90d9', BEA: '#9b7fe8', FOMC: '#d4af37', FED_SPEECHES:'#d4af37', TREASURY: '#4caf82', IMF: '#3ab8c4', REUTERS: '#f59e42',
};

function timeAgo(d: string) { const diff=Date.now()-new Date(d).getTime(),m=Math.floor(diff/60000),h=Math.floor(diff/3600000),dy=Math.floor(diff/86400000); return m<60?`${m}m ago`:h<24?`${h}h ago`:`${dy}d ago`; }

export default function WTFNewsFeed({ seriesSlug, maxItems=15 }: WTFNewsFeedProps) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const params=new URLSearchParams({limit:String(maxItems)});
    if(seriesSlug) params.set('series_slug',seriesSlug);
    fetch(`/api/news/feed?${params}`).then(r=>r.json()).then(data=>{setItems(Array.isArray(data)?data:[]);setLoading(false);}).catch(()=>setLoading(false));
  },[seriesSlug,maxItems]);
  return(<aside style={{flex:1,background:'#0b0f0f',border:'1px solid #1b2226',borderRadius:'16px',padding:'20px',maxHeight:'',overflowY:'auto'}}><div style={{fontSize:'12px',fontWeight:700,opacity:0.5,marginBottom:'16px',letterSpacing:'1px'}}>LIVE WIRE</div>{loading&&<div style={{color:'#333'}}>Connecting...</div>}{!loading&&items.length===0&&<div style={{color:'#333'}}>No items yet</div>}<div style={{display:'flex',flexDirection:'column',gap:'14px'}}>{items.map(item=>(<a key={item.id} href={item.url?.startsWith('_no_url_')?'#':item.url} target="_blank" rel="noreferrer" style={{textDecoration:'none',color:'inherit',display:'block',paddingBottom:'14px',borderBottom:'1px solid #1b2226'}}><div style={{display:'flex'justifyContent:'space-between',alignItems:'center',marginBottom:'5px'}}><span style={{fontSize:'10px',color:SOURCE_COLORS[item.source]||'#888',weight:700}}>{item.source}</span><span style={{fontSize:'10px',color:'#333'}}>{timeAgo(item.published_at)}</span></div><div style={{fontSize:'13px',lineHeight:'1.45',fontWeight:500,marginBottom:'5px',color:'#dde8e8'}}>{item.headline}</div></a>))}</div></aside>);
}
