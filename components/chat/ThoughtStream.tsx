'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export interface ThoughtLog {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'step';
  timestamp?: string;
}

interface ThoughtStreamProps {
  logs: ThoughtLog[];
  isProcessing: boolean;
}

export default function ThoughtStream({ logs, isProcessing }: ThoughtStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full h-full flex flex-col bg-black/40 border-l border-white/10 backdrop-blur-md rounded-r-2xl overflow-hidden font-mono text-xs">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-400">
          <Terminal size={14} />
          <span className="font-bold tracking-wider uppercase">System Output</span>
        </div>
        {isProcessing && (
          <div className="flex items-center gap-2 text-cyan-500/70">
            <Loader2 size={12} className="animate-spin" />
            <span>PROCESSING</span>
          </div>
        )}
      </div>

      {/* Logs Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth no-scrollbar"
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-start gap-3 ${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-emerald-400' :
                log.type === 'warning' ? 'text-amber-400' :
                log.type === 'step' ? 'text-cyan-300' :
                'text-white/70'
              }`}
            >
              <span className="mt-0.5 shrink-0 opacity-50">
                {log.timestamp || new Date().toLocaleTimeString([], { hour12: false })}
              </span>
              
              <div className="flex-1 break-words leading-relaxed">
                {log.type === 'step' && <span className="mr-2 text-cyan-500">➜</span>}
                {log.type === 'success' && <CheckCircle2 size={12} className="inline mr-2" />}
                {log.type === 'error' && <AlertCircle size={12} className="inline mr-2" />}
                
                {log.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isProcessing && logs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-cyan-500/40 pl-[4.5em] pt-2"
          >
            <span className="animate-pulse">_</span>
          </motion.div>
        )}

        {logs.length === 0 && !isProcessing && (
          <div className="h-full flex flex-col items-center justify-center text-white/20 italic space-y-2">
            <Terminal size={32} />
            <p>Ready for analysis...</p>
          </div>
        )}
      </div>
    </div>
  );
}
