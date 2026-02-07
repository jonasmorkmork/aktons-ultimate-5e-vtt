import React, { useState } from 'react';

const SendMessageModal = ({ isOpen, onClose, onSend }) => {
    const [text, setText] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend(text);
        setText("");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl p-6 relative">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Send Message to DM
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea 
                        className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm min-h-[100px] outline-none focus:border-blue-500 resize-none" 
                        placeholder="Write your message..." 
                        value={text} 
                        onChange={(e) => setText(e.target.value)} 
                        autoFocus 
                    />
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg text-sm">Send</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SendMessageModal;