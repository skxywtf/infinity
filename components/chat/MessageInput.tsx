'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessageInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export default function MessageInput({ onSend, disabled, placeholder = "Ask InfinityXZ about a stock..." }: MessageInputProps) {
    const [value, setValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!value.trim() || disabled) return;
        onSend(value);
        setValue('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Auto-resize
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);

    return (
        <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur opacity-0 group-hover:opacity-100 transition duration-500" />

            <div className="relative flex items-end gap-2 bg-[#0A101F]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
                <div className="flex-1 min-h-[44px]">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={1}
                        className="w-full bg-transparent border-none text-white placeholder-white/40 text-sm p-3 focus:ring-0 focus:outline-none resize-none max-h-32 no-scrollbar"
                    />
                </div>

                <button
                    type="submit"
                    disabled={!value.trim() || disabled}
                    className="h-10 w-10 shrink-0 rounded-xl bg-cyan-500 text-black flex items-center justify-center hover:bg-cyan-400 disabled:opacity-50 disabled:hover:bg-cyan-500 transition-all shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)] disabled:shadow-none"
                >
                    {disabled ? (
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                        <Send size={18} />
                    )}
                </button>
            </div>
        </form>
    );
}
