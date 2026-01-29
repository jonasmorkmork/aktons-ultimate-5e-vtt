import React from 'react';
import { Upload, X, Check, FileJson } from './MapIcons'; 

const ImportModal = ({ isOpen, step, stats, progress, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-600 rounded-xl shadow-2xl max-w-md w-full p-8 flex flex-col items-center">
                
                {/* Ikon */}
                <div className="bg-slate-800 p-4 rounded-full mb-6 border border-slate-700 shadow-inner">
                    {step === 'processing' ? (
                        <Upload className="w-8 h-8 text-cyan-500 animate-bounce" />
                    ) : (
                        <FileJson className="w-8 h-8 text-purple-400" />
                    )}
                </div>

                <h2 className="text-xl font-bold text-slate-100 mb-2">
                    {step === 'confirm' ? 'Confirm Import' : 'Importing Library'}
                </h2>

                {/* --- STATE 1: CONFIRMATION --- */}
                {step === 'confirm' && (
                    <div className="w-full text-center">
                        <p className="text-slate-400 text-sm mb-6">
                            We found the following data in your file. <br/>
                            Do you want to merge this with your current library?
                        </p>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6 w-full">
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                                <div className="text-xl font-bold text-slate-200">{stats.battlefields}</div>
                                <div className="text-[10px] uppercase text-slate-500 font-bold">Battlefields</div>
                            </div>
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                                <div className="text-xl font-bold text-slate-200">{stats.maps}</div>
                                <div className="text-[10px] uppercase text-slate-500 font-bold">Maps</div>
                            </div>
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                                <div className="text-xl font-bold text-slate-200">{stats.tokens}</div>
                                <div className="text-[10px] uppercase text-slate-500 font-bold">Tokens</div>
                            </div>
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                                <div className="text-xl font-bold text-slate-200">{stats.folders}</div>
                                <div className="text-[10px] uppercase text-slate-500 font-bold">Folders</div>
                            </div>
                        </div>

                        {/* Knapper */}
                        <div className="flex gap-3">
                            <button onClick={onCancel} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                                <X className="w-4 h-4" /> Cancel
                            </button>
                            <button onClick={onConfirm} className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-lg">
                                <Check className="w-4 h-4" /> Merge Data
                            </button>
                        </div>
                    </div>
                )}

                {/* --- STATE 2: PROCESSING (Progress Bar) --- */}
                {step === 'processing' && (
                    <div className="w-full">
                         <p className="text-slate-400 text-sm mb-6 text-center">Please wait while we process your backup and update the database.</p>

                        <div className="w-full bg-slate-800 rounded-full h-4 mb-3 border border-slate-700 overflow-hidden relative">
                            <div className="absolute inset-0 bg-slate-800 w-full h-full" />
                            <div 
                                className="h-full bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-1 relative z-10"
                                style={{ width: `${progress}%` }}
                            >
                                {progress > 10 && <div className="w-1 h-full bg-white/20 blur-[1px] absolute right-0 animate-pulse"></div>}
                            </div>
                        </div>

                        <div className="flex justify-between w-full text-xs font-mono font-bold">
                            <span className="text-cyan-400 animate-pulse">{message}</span>
                            <span className="text-slate-500">{Math.round(progress)}%</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImportModal;