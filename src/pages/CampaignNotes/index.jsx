import React, { useEffect } from 'react';
import { useCampaignNotes } from './hooks/useCampaignNotes';

// Sub-components
import CreateNotebookModal from './CreateNotebookModal';
import NotesMenu from './NotesMenu';
import { InputModal, ConfirmModal } from './CampaignNoteModals';
import GlobalSearchModal from './GlobalSearchModal'; 
import NoteSidebar from './components/NoteSidebar';
import NoteContent from './components/NoteContent';

const CampaignNotes = () => {
    // Vi henter AL logik og state fra vores custom hook
    const logic = useCampaignNotes();
    const { 
        isLoading, view, activeNotebook, 
        showCreateModal, setShowCreateModal, editingNotebook, setEditingNotebook,
        showSearch, setShowSearch, 
        inputModal, setInputModal, confirmModal, setConfirmModal,
        allNotes, handleOpenNotebook, handleCreateNotebook, handleUpdateNotebook, handleDelete, 
        handleCreateItem, handleSelectFile, initiateCreateItem, 
        showMobileSidebar, setShowMobileSidebar, handleUndo,
        handleExportNotebook // Hent export funktionen
    } = logic;

    // Global Shortcuts Listener (Ctrl+P, Ctrl+Z)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
                e.preventDefault(); setShowSearch(prev => !prev);
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                const activeTag = document.activeElement.tagName.toLowerCase();
                const isContentEditable = document.activeElement.isContentEditable;
                if (!isContentEditable && activeTag !== 'input' && activeTag !== 'textarea') {
                    e.preventDefault(); handleUndo();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, setShowSearch]);

    if (isLoading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading Notebooks...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
            
            <GlobalSearchModal 
                isOpen={showSearch} onClose={() => setShowSearch(false)} 
                notes={activeNotebook ? logic.currentFiles.filter(n => n.type === 'file') : allNotes.filter(n => n.type === 'file')} 
                onSelect={(note) => { 
                    if (!activeNotebook || note.notebookId !== activeNotebook.id) {
                        const targetNotebook = allNotes.find(n => n.id === note.notebookId);
                        if (targetNotebook) logic.setActiveNotebook(targetNotebook);
                        logic.setView('notebook');
                    }
                    handleSelectFile(note); setShowSearch(false); 
                }}
                onCreate={(name) => { initiateCreateItem('file', null, 'blank', name); setShowSearch(false); }}
            />

            <CreateNotebookModal 
                isOpen={showCreateModal || !!editingNotebook} 
                onClose={() => { setShowCreateModal(false); setEditingNotebook(null); }} 
                onSubmit={editingNotebook ? handleUpdateNotebook : handleCreateNotebook}
                initialData={editingNotebook}
            />

            <InputModal 
                isOpen={inputModal.isOpen} onClose={() => setInputModal({ ...inputModal, isOpen: false })} 
                onSubmit={(result) => {
                    const name = typeof result === 'object' ? result.name : result;
                    const bp = typeof result === 'object' ? result.blueprint : 'blank';
                    handleCreateItem(name, undefined, undefined, bp);
                }} 
                title={`Create new ${inputModal.type}`} placeholder={`Name of ${inputModal.type}...`} 
                defaultValue={inputModal.blueprintKey || ""} type={inputModal.type} 
            />

            <ConfirmModal 
                isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
                onConfirm={handleDelete} title={confirmModal.title} message={confirmModal.message} isDanger 
            />

            {view === 'menu' && (
                <NotesMenu 
                    notebooks={allNotes.filter(n => n.type === 'notebook')} 
                    onOpen={handleOpenNotebook} onCreate={() => setShowCreateModal(true)}
                    onEdit={logic.handleEditNotebook} 
                    onDelete={(id) => setConfirmModal({ isOpen: true, noteId: id, title: "Delete Notebook?", message: "All notes inside will be lost." })}
                    onExport={handleExportNotebook} // Send export funktion med
                />
            )}

            {view === 'notebook' && activeNotebook && (
                <div className="flex h-screen overflow-hidden relative">
                    {showMobileSidebar && (
                        <div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm animate-in fade-in" onClick={() => setShowMobileSidebar(false)}></div>
                    )}

                    {/* SIDEBAR */}
                    <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64 ${showMobileSidebar ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
                        <NoteSidebar logic={logic} />
                    </div>

                    {/* MAIN CONTENT */}
                    <NoteContent logic={logic} />
                </div>
            )}
        </div>
    );
};

export default CampaignNotes;