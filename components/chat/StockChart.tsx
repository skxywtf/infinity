'use client';

import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

export default function StockChart({ ticker }: { ticker: string; data?: any[] }) {
    return (
        <div className="w-full h-96 bg-black/20 rounded-xl overflow-hidden border border-white/5 my-3 animate-in fade-in zoom-in-95 duration-500 relative">
            <AdvancedRealTimeChart
                symbol={ticker}
                theme="dark"
                autosize
                hide_side_toolbar={true}
                allow_symbol_change={false}
                details={true}
                hotlist={false}
                calendar={false}
                copyrightStyles={{ parent: { fontSize: '10px', color: '#666' } }}
            />
        </div>
    );
}
