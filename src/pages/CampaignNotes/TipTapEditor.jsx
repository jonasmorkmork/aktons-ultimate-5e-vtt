import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import Highlight from '@tiptap/extension-highlight';
import tippy from 'tippy.js'; 
import 'tippy.js/dist/tippy.css';

import { WikiLink } from './WikiLinkExtension'; 
import { LinkIcon } from '../CampaignManager/components/CampaignIcons';

import SlashCommand from './SlashCommand';
import { SlashMenu } from './SlashMenu';

// Ikoner
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const ArrowUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>;
const ArrowDown = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

const TiptapEditor = ({ initialContent, onUpdate, onWikiLinkClick, isEditable = true }) => {
    
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [showReplace, setShowReplace] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [replaceTerm, setReplaceTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]); 
    const [currentResultIndex, setCurrentResultIndex] = useState(-1);
    
    const searchInputRef = useRef(null);

    const getSlashSuggestions = () => {
        return {
            items: ({ query }) => {
                const items = [
                    { title: 'Heading 1', icon: <span className="font-bold text-xs">H1</span>, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run() },
                    { title: 'Heading 2', icon: <span className="font-bold text-xs">H2</span>, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run() },
                    { title: 'Bullet List', icon: <span className="font-bold text-xs">•</span>, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run() },
                    { title: 'Quote', icon: <span className="italic text-xs">"</span>, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run() },
                    { title: 'Divider', icon: <span className="font-bold text-xs">—</span>, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run() },
                ];
                return items.filter(item => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10);
            },
            render: () => {
                let component;
                let popup;
                return {
                    onStart: props => {
                        component = new ReactRenderer(SlashMenu, { props, editor: props.editor });
                        if (!props.clientRect) return;
                        popup = tippy('body', {
                            getReferenceClientRect: props.clientRect,
                            appendTo: () => document.body,
                            content: component.element,
                            showOnCreate: true,
                            interactive: true,
                            trigger: 'manual',
                            placement: 'bottom-start',
                            theme: 'dark',
                            maxWidth: 'none',
                            zIndex: 9999,
                        });
                    },
                    onUpdate(props) {
                        component.updateProps(props);
                        if (!props.clientRect) return;
                        popup[0].setProps({ getReferenceClientRect: props.clientRect });
                    },
                    onKeyDown(props) {
                        if (props.event.key === 'Escape') { popup[0].hide(); return true; }
                        return component.ref?.onKeyDown(props);
                    },
                    onExit() { popup[0].destroy(); component.destroy(); },
                };
            },
        };
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: false }), 
            
            // --- FIX HER: Custom rendering af Headings ---
            Heading.extend({
                renderHTML({ node, HTMLAttributes }) {
                    const hasLevel = this.options.levels.includes(node.attrs.level);
                    const level = hasLevel ? node.attrs.level : this.options.levels[0];
                    const classes = {
                        1: 'text-3xl font-bold text-amber-500 mb-4 mt-6 border-b border-slate-700 pb-2 font-serif',
                        2: 'text-2xl font-bold text-amber-400 mb-3 mt-5 font-serif',
                        3: 'text-xl font-bold text-slate-200 mb-2 mt-4',
                    };
                    return [`h${level}`, { ...HTMLAttributes, class: classes[level] }, 0];
                },
            }).configure({ levels: [1, 2, 3] }),
            // ---------------------------------------------

            Placeholder.configure({ placeholder: "Type '/' for commands..." }),
            WikiLink.configure({ onWikiLinkClick }),
            SlashCommand.configure({ suggestion: getSlashSuggestions() }),
            Highlight.configure({ multicast: true }), 
        ],
        content: initialContent,
        editable: isEditable,
        autofocus: 'end', 
        onUpdate: ({ editor }) => {
            onUpdate(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px]',
            },
            handleClick: (view, pos, event) => {
                const target = event.target.closest('span[data-wiki-link], .wiki-link');
                if (target) {
                    if (event.ctrlKey || event.metaKey) {
                        const pageName = target.getAttribute('data-target') || target.innerText;
                        const cleanName = pageName.replace(/[\[\]]/g, '').trim();
                        if (cleanName && onWikiLinkClick) {
                            event.preventDefault(); 
                            event.stopPropagation(); 
                            onWikiLinkClick(cleanName);
                            return true; 
                        }
                    }
                }
                return false;
            }
        },
    });

    useEffect(() => { return () => editor?.destroy(); }, [editor]);

    // --- SEARCH & REPLACE LOGIC ---
    const performSearch = (term) => {
        if (!editor) return;
        const currentPos = editor.state.selection.from;
        editor.chain().selectAll().unsetHighlight().run();
        editor.commands.setTextSelection(currentPos);

        if (!term) {
            setSearchResults([]);
            setCurrentResultIndex(-1);
            return;
        }

        const { doc } = editor.state;
        const results = [];
        
        doc.descendants((node, pos) => {
            if (node.isText) {
                const text = node.text;
                const lowerText = text.toLowerCase();
                const lowerTerm = term.toLowerCase();
                let index = lowerText.indexOf(lowerTerm);
                while (index !== -1) {
                    results.push({ from: pos + index, to: pos + index + term.length });
                    index = lowerText.indexOf(lowerTerm, index + 1);
                }
            }
        });

        setSearchResults(results);

        if (results.length > 0) {
            const chain = editor.chain();
            results.forEach(res => {
                chain.setTextSelection(res).setHighlight();
            });
            chain.run();
            setCurrentResultIndex(0);
            selectResult(results[0]); 
        } else {
            setCurrentResultIndex(-1);
            editor.commands.setTextSelection(currentPos);
        }
    };

    const selectResult = (result) => {
        if (!editor || !result) return;
        editor.commands.setTextSelection({ from: result.from, to: result.to });
        editor.commands.scrollIntoView();
    };

    const nextResult = () => {
        if (searchResults.length === 0) return;
        const nextIndex = (currentResultIndex + 1) % searchResults.length;
        setCurrentResultIndex(nextIndex);
        selectResult(searchResults[nextIndex]);
    };

    const prevResult = () => {
        if (searchResults.length === 0) return;
        const prevIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
        setCurrentResultIndex(prevIndex);
        selectResult(searchResults[prevIndex]);
    };

    const replaceCurrent = () => {
        if (currentResultIndex === -1 || searchResults.length === 0) return;
        editor.chain().focus().insertContent(replaceTerm).run();
        performSearch(searchTerm);
    };

    const replaceAll = () => {
        if (!searchTerm || searchResults.length === 0) return;
        const reverseResults = [...searchResults].reverse();
        const chain = editor.chain().focus();
        reverseResults.forEach(res => chain.setTextSelection(res).insertContent(replaceTerm));
        chain.unsetHighlight().run();
        setSearchResults([]);
        setCurrentResultIndex(-1);
        setSearchTerm("");
        if (searchInputRef.current) searchInputRef.current.value = "";
    };

    const closeSearchBar = () => {
        setShowSearchBar(false);
        setShowReplace(false);
        setSearchTerm("");
        setReplaceTerm("");
        setSearchResults([]);
        if (editor) editor.chain().selectAll().unsetHighlight().run();
        editor?.commands.focus();
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault(); 
                setShowSearchBar(true);
                setTimeout(() => {
                    searchInputRef.current?.focus();
                    if (editor && !editor.state.selection.empty) {
                        const selection = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to);
                        if (selection) {
                            setSearchTerm(selection);
                            performSearch(selection);
                            if(searchInputRef.current) searchInputRef.current.value = selection;
                        }
                    }
                }, 50);
            }
            if (e.key === 'Escape' && showSearchBar) {
                closeSearchBar();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editor, showSearchBar]);

    if (!editor) return null;

    return (
        <div className="relative">
            {editor && isEditable && showSearchBar && (
                <div className="sticky top-0 z-[60] flex justify-center mb-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-slate-900 border border-slate-600 rounded-lg shadow-2xl p-2 flex flex-col gap-2 min-w-[300px]">
                        <div className="flex items-center gap-1">
                            <div className="flex items-center bg-slate-800 rounded px-2 py-1.5 gap-2 border border-slate-600 flex-1">
                                <SearchIcon />
                                <input 
                                    ref={searchInputRef}
                                    type="text" 
                                    placeholder="Find..." 
                                    className="bg-transparent border-none outline-none text-xs text-white w-full placeholder-slate-500"
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        performSearch(e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (e.shiftKey) prevResult();
                                            else nextResult();
                                        }
                                    }}
                                />
                                <div className="text-[10px] text-slate-500 border-l border-slate-600 pl-2 min-w-[35px] text-center font-mono">
                                    {searchResults.length > 0 ? `${currentResultIndex + 1}/${searchResults.length}` : '0/0'}
                                </div>
                            </div>
                            <button onClick={prevResult} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Previous"><ArrowUp /></button>
                            <button onClick={nextResult} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Next"><ArrowDown /></button>
                            <button onClick={() => setShowReplace(!showReplace)} className={`p-1.5 rounded transition-colors ${showReplace ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`} title="Toggle Replace"><EditIcon /></button>
                            <button onClick={closeSearchBar} className="p-1.5 hover:bg-red-900/50 hover:text-red-400 rounded text-slate-400"><XIcon /></button>
                        </div>
                        {showReplace && (
                            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                <div className="flex items-center bg-slate-800 rounded px-2 py-1.5 gap-2 border border-slate-600 flex-1">
                                    <span className="text-slate-500 text-xs font-bold">R</span>
                                    <input 
                                        type="text" 
                                        placeholder="Replace with..." 
                                        className="bg-transparent border-none outline-none text-xs text-white w-full placeholder-slate-500"
                                        value={replaceTerm}
                                        onChange={(e) => setReplaceTerm(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') replaceCurrent(); }}
                                    />
                                </div>
                                <button onClick={replaceCurrent} className="px-2 py-1 text-[10px] font-bold bg-slate-700 hover:bg-blue-600 text-white rounded border border-slate-600 transition-colors">Replace</button>
                                <button onClick={replaceAll} className="px-2 py-1 text-[10px] font-bold bg-slate-700 hover:bg-blue-600 text-white rounded border border-slate-600 transition-colors">All</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!showSearchBar && editor && isEditable && (
                <div className="sticky top-0 z-50 flex justify-center mb-4 pointer-events-none">
                    <div className="pointer-events-auto bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-1 flex gap-1 shadow-xl transition-all opacity-80 hover:opacity-100">
                        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 rounded font-bold text-sm transition-colors ${editor.isActive('bold') ? 'bg-amber-900/50 text-amber-400' : 'hover:bg-slate-800'}`}>B</button>
                        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 rounded italic text-sm transition-colors ${editor.isActive('italic') ? 'bg-amber-900/50 text-amber-400' : 'hover:bg-slate-800'}`}>I</button>
                        <div className="w-px bg-slate-700 mx-1 h-4 self-center"></div>
                        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-2 py-1 rounded font-serif font-bold text-base transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-amber-900/50 text-amber-400' : 'hover:bg-slate-800'}`}>H1</button>
                        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 rounded font-serif font-bold text-sm transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-amber-900/50 text-amber-400' : 'hover:bg-slate-800'}`}>H2</button>
                        <div className="w-px bg-slate-700 mx-1 h-4 self-center"></div>
                        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-2 py-1 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-amber-900/50 text-amber-400' : 'hover:bg-slate-800'}`}>• List</button>
                        <div className="w-px bg-slate-700 mx-1 h-4 self-center"></div>
                        <button title="Link to Page (Ctrl+K)" onClick={() => editor.chain().focus().toggleWikiLink().run()} className={`px-2 py-1 rounded transition-colors hover:bg-slate-800`}><LinkIcon size={14}/></button>
                        <div className="w-px bg-slate-700 mx-1 h-4 self-center"></div>
                        <button title="Find (Ctrl+F)" onClick={() => { setShowSearchBar(true); setTimeout(() => searchInputRef.current?.focus(), 50); }} className={`px-2 py-1 rounded transition-colors hover:bg-slate-800 text-slate-400 hover:text-white`}><SearchIcon /></button>
                    </div>
                </div>
            )}

            <EditorContent editor={editor} />
        </div>
    );
};

export default TiptapEditor;