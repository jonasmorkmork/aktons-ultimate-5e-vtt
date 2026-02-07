import React, { useEffect } from 'react';
import { useEditor, EditorContent, mergeAttributes, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import tippy from 'tippy.js'; // VIGTIGT
import 'tippy.js/dist/tippy.css'; // VIGTIGT

import { WikiLink } from './WikiLinkExtension'; 
import { LinkIcon } from '../CampaignManager/components/CampaignIcons';

// Import de nye ting
import SlashCommand from './SlashCommand';
import { SlashMenu } from './SlashMenu';

const TiptapEditor = ({ initialContent, onUpdate, onWikiLinkClick, isEditable = true }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: false }),
            Heading.extend({
                renderHTML({ node, HTMLAttributes }) {
                    const hasLevel = this.options.levels.includes(node.attrs.level);
                    const level = hasLevel ? node.attrs.level : this.options.levels[0];
                    const classes = {
                        1: 'text-3xl font-bold text-amber-500 mb-4 mt-6 border-b border-slate-700 pb-2 font-serif-dnd',
                        2: 'text-2xl font-bold text-amber-400 mb-3 mt-5 font-serif-dnd',
                        3: 'text-xl font-bold text-amber-300 mb-2 mt-4',
                    };
                    return [`h${level}`, mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: classes[level] }), 0];
                },
            }).configure({ levels: [1, 2, 3] }),
            Placeholder.configure({ placeholder: "Type '/' for commands..." }), // Opdateret placeholder
            WikiLink,
            
            // --- SLASH COMMAND SETUP ---
            SlashCommand.configure({
                suggestion: {
                    items: () => [], // Items er hardcoded i SlashMenu.jsx for enkelhedens skyld her
                    render: () => {
                        let component;
                        let popup;

                        return {
                            onStart: props => {
                                component = new ReactRenderer(SlashMenu, {
                                    props,
                                    editor: props.editor,
                                });

                                if (!props.clientRect) return;

                                popup = tippy('body', {
                                    getReferenceClientRect: props.clientRect,
                                    appendTo: () => document.body,
                                    content: component.element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: 'manual',
                                    placement: 'bottom-start',
                                    theme: 'dark', // Kræver CSS, men vi styler manuelt i komponenten
                                    zIndex: 9999, // Høj z-index for at ligge over alt andet
                                });
                            },
                            onUpdate(props) {
                                component.updateProps(props);
                                if (!props.clientRect) return;
                                popup[0].setProps({
                                    getReferenceClientRect: props.clientRect,
                                });
                            },
                            onKeyDown(props) {
                                if (props.event.key === 'Escape') {
                                    popup[0].hide();
                                    return true;
                                }
                                return component.ref?.onKeyDown(props);
                            },
                            onExit() {
                                popup[0].destroy();
                                component.destroy();
                            },
                        };
                    },
                },
            }),
        ],
        content: initialContent,
        editable: isEditable,
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-amber max-w-none focus:outline-none min-h-[50vh] text-slate-300',
            },
            handleClick: (view, pos, event) => {
                const target = event.target.closest('span[data-wiki-link]');
                if (target) {
                    const pageName = target.getAttribute('data-target');
                    if (onWikiLinkClick) {
                        onWikiLinkClick(pageName);
                        return true; 
                    }
                }
                return false;
            }
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onUpdate(html);
        },
    });

    useEffect(() => {
        if (editor && initialContent !== editor.getHTML()) {
            editor.commands.setContent(initialContent);
        }
    }, [initialContent, editor]);

    if (!editor) return null;

    return (
        <div className="editor-wrapper relative">
            {/* Toolbar (uændret) */}
            <div className="flex gap-2 mb-4 border-b border-slate-700 pb-2 text-xs text-slate-400 overflow-x-auto sticky top-0 bg-[#0d1117] z-10 pt-2 items-center">
                <button onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 rounded font-bold transition-colors ${editor.isActive('bold') ? 'bg-amber-900/50 text-amber-400' : 'hover:bg-slate-800'}`}>B</button>
                <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 rounded italic transition-colors ${editor.isActive('italic') ? 'bg-amber-900/50 text-amber-400' : 'hover:bg-slate-800'}`}>I</button>
                <div className="w-px bg-slate-700 mx-1 h-4"></div>
                <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-2 py-1 rounded font-serif font-bold text-lg transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-amber-900/50 text-amber-400' : 'hover:bg-slate-800'}`}>H1</button>
                <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 rounded font-serif font-bold text-base transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-amber-900/50 text-amber-400' : 'hover:bg-slate-800'}`}>H2</button>
                <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-2 py-1 rounded font-serif font-bold text-sm transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-amber-900/50 text-amber-400' : 'hover:bg-slate-800'}`}>H3</button>
                <div className="w-px bg-slate-700 mx-1 h-4"></div>
                <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-2 py-1 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-amber-900/50 text-amber-400' : 'hover:bg-slate-800'}`}>List</button>
                <div className="w-px bg-slate-700 mx-1 h-4"></div>
                <button title="Link to Page (Ctrl+K)" onClick={() => editor.chain().focus().toggleWikiLink().run()} className={`px-2 py-1 rounded transition-colors ${editor.isActive('wikiLink') ? 'bg-amber-900/50 text-amber-400' : 'hover:bg-slate-800'}`}>
                    <LinkIcon size={14} />
                </button>
            </div>
            
            <EditorContent editor={editor} />
        </div>
    );
};

export default TiptapEditor;