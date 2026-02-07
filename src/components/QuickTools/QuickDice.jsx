import React, { useState } from 'react';

const QuickDice = ({ onClose }) => {
    const [history, setHistory] = useState([]);
    
    const roll = (sides) => {
        const result = Math.floor(Math.random() * sides) + 1;
        const newLog = { 
            id: Date.now(), 
            dice: `d${sides}`, 
            val: result,
            crit: sides === 20 && result === 20,
            fail: sides === 20 && result === 1
        };
        setHistory(prev => [newLog, ...prev].slice(0, 10));
    };

    return (
        <div className="fixed bottom-20 right-8 z-[400] w-64 animate-in slide-in-from-bottom-4">
            <div className="bg-slate-900 border border-slate-600 shadow-2xl rounded-xl overflow-hidden">
                <div className="bg-slate-950 p-2 flex justify-between items-center border-b border-slate-700">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">Quick Roller</span>
                    <button onClick={onClose} className="text-slate-500 hover:text-white px-2">✕</button>
                </div>
                
                <div className="p-3 bg-slate-900 grid grid-cols-4 gap-2">
                    {[4, 6, 8, 10, 12, 20, 100].map(d => (
                        <button 
                            key={d} 
                            onClick={() => roll(d)}
                            className={`
                                h-10 rounded font-bold text-sm border shadow-sm transition-all active:scale-95
                                ${d === 20 ? 'col-span-2 bg-amber-700 hover:bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-300'}
                            `}
                        >
                            d{d}
                        </button>
                    ))}
                </div>

                <div className="bg-black/40 h-32 overflow-y-auto p-2 space-y-1 border-t border-slate-800 custom-scrollbar">
                    {history.length === 0 && <div className="text-center text-xs text-slate-600 italic mt-4">Roll something...</div>}
                    {history.map(h => (
                        <div key={h.id} className="flex justify-between items-center text-xs px-2 py-1 rounded bg-white/5">
                            <span className="text-slate-400 font-mono">{h.dice}</span>
                            <span className={`font-bold ${h.crit ? 'text-green-400' : h.fail ? 'text-red-400' : 'text-white'}`}>
                                {h.val}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuickDice;