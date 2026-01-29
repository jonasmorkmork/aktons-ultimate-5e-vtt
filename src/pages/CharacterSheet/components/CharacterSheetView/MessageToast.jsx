import React from 'react';

const MessageToast = ({ message, queueCount, onDismiss }) => {
    if (!message) return null;

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[400] w-[90%] max-w-lg animate-in slide-in-from-top-4 duration-300">
            <div className="bg-slate-900/95 border-2 border-amber-500 rounded-xl shadow-[0_0_50px_rgba(245,158,11,0.3)] p-6 relative overflow-hidden backdrop-blur-md">
                {/* Queue count indicator hvis mere end 1 */}
                {queueCount > 1 && (
                    <div className="absolute top-2 right-12 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        +{queueCount - 1} more
                    </div>
                )}
                <button 
                    onClick={onDismiss}
                    className="absolute top-2 right-2 text-slate-500 hover:text-white p-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>

                <div className="flex gap-4">
                    <div className="bg-amber-900/30 p-3 rounded-full h-fit border border-amber-700/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div>
                        <h4 className="text-amber-500 font-bold uppercase text-xs tracking-widest mb-1">Message from {message.sender}</h4>
                        <p className="text-lg font-serif text-white leading-relaxed">
                            {message.text}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default MessageToast;