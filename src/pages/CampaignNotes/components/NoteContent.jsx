import React from 'react';
import TiptapEditor from '../TipTapEditor';
import { FileIcon, PlusIcon, CheckCircle, ChevronRight, BookIcon } from '../../CampaignManager/components/CampaignIcons'; 

// Menu Ikon til mobil
const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);

const NoteContent = ({ logic }) => {
    const { 
        activeFile, activeNotebook, title, setTitle, saveStatus, 
        setEditorContent, handleSelectFile, setShowMobileSidebar, setInputModal, 
        initiateCreateItem, currentFiles
    } = logic;

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden w-full">
            {/* MOBILE HEADER */}
            <div className="md:hidden flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900 text-white shrink-0 pl-16">
                <span className="font-bold truncate px-2 text-sm text-slate-200 flex-1">
                    {activeFile ? activeFile.name : activeNotebook.name}
                </span>
                <button onClick={() => setShowMobileSidebar(true)} className="text-slate-400 hover:text-white flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded border border-slate-700">
                    <span className="text-[10px] font-bold uppercase">Files</span>
                    <MenuIcon />
                </button>
            </div>

            {activeFile ? (
                <div className="flex-1 overflow-hidden relative flex flex-col">
                    {/* DESKTOP HEADER */}
                    <div className="hidden md:flex h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm shrink-0 items-center sticky top-0 z-10">
                        <div className="max-w-3xl w-full mx-auto px-8 flex justify-between items-center">
                            <input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-transparent text-amber-500 font-bold outline-none text-2xl w-full max-w-lg placeholder-slate-600 focus:border-b border-amber-500/30 transition-colors" placeholder="Page Title" />
                            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                                {saveStatus === 'saving' && <span className="text-yellow-500 animate-pulse">Saving...</span>}
                                {saveStatus === 'saved' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={12}/> Saved</span>}
                                {saveStatus === 'error' && <span className="text-red-500">Error!</span>}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar cursor-text px-4 md:px-8 py-4 md:py-8">
                        <div className="max-w-3xl mx-auto min-h-full">
                            {/* MOBILE TITLE INPUT */}
                            <div className="md:hidden mb-4 border-b border-slate-800 pb-2">
                                <input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-transparent text-amber-500 font-bold outline-none text-xl w-full placeholder-slate-600" placeholder="Page Title" />
                                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-1">
                                    {saveStatus === 'saving' && <span className="text-yellow-500 animate-pulse">Saving...</span>}
                                    {saveStatus === 'saved' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={10}/> Saved</span>}
                                </div>
                            </div>

                            <TiptapEditor 
                                key={activeFile.id} 
                                initialContent={activeFile.content} 
                                onUpdate={setEditorContent}
                                onWikiLinkClick={(targetName) => {
                                    const target = currentFiles.find(f => f.name.toLowerCase() === targetName.toLowerCase() && f.type === 'file');
                                    if (target) {
                                        handleSelectFile(target);
                                    } else {
                                        initiateCreateItem('file', null, 'blank', targetName);
                                    }
                                }} 
                            />
                            <div className="h-40"></div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center bg-slate-950/50">
                    <div className="bg-slate-900 p-6 rounded-full mb-4 shadow-inner">
                        <BookIcon size={48} className="opacity-20" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-500 mb-2">Welcome to {activeNotebook.name}</h3>
                    <p className="text-sm max-w-md">Select a note from the sidebar to start writing, or create a new file.</p>
                    
                    <div className="mt-8 grid grid-cols-1 gap-2 w-full max-w-xs">
                        <button onClick={() => setInputModal({ isOpen: true, type: 'file' })} className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-amber-500/50 hover:bg-slate-800 transition-all group text-left">
                            <div className="bg-amber-900/20 p-2 rounded text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors"><PlusIcon /></div>
                            <div><div className="text-sm font-bold text-slate-300">New Note</div><div className="text-[10px] text-slate-500">Create a blank page</div></div>
                        </button>
                    </div>

                    <div className="mt-8 w-full max-w-md">
                        <div className="text-[10px] font-bold uppercase text-slate-600 mb-2 tracking-wider">Recent Changes</div>
                        <div className="space-y-1">
                            {(() => {
                                const recent = [...currentFiles].sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 3);
                                if(recent.length === 0) return <div className="text-xs italic opacity-50">No notes yet</div>
                                return recent.map(file => (
                                    <button key={file.id} onClick={() => handleSelectFile(file)} className="w-full flex items-center gap-3 p-2 hover:bg-slate-900 rounded-lg transition-colors group text-left border border-transparent hover:border-slate-800">
                                        <div className="bg-slate-900 p-1.5 rounded group-hover:bg-slate-700 text-slate-400 group-hover:text-amber-500 transition-colors"><FileIcon size={16} /></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-slate-300 font-medium truncate group-hover:text-white">{file.name}</div>
                                            <div className="text-[10px] text-slate-500">Last edited: {new Date(file.updatedAt || file.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400" />
                                    </button>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NoteContent;