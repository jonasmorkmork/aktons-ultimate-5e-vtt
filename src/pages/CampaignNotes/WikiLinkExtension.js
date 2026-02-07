import { Mark, mergeAttributes, InputRule } from '@tiptap/core';

export const WikiLink = Mark.create({
    name: 'wikiLink',
    priority: 1000,
    keepOnSplit: false,
    inclusive: false, 
    
    addAttributes() {
        return {
            target: {
                default: null,
                parseHTML: element => element.getAttribute('data-target'),
                renderHTML: attributes => {
                    return {
                        'data-target': attributes.target,
                    }
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-wiki-link]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, {
                'data-wiki-link': '',
                // Ingen ændringer i styling her, da det ser korrekt ud
                class: 'text-amber-400 hover:text-amber-300 hover:underline cursor-pointer font-bold bg-amber-900/20 box-decoration-clone', 
            }),
            0,
        ];
    },

    addCommands() {
        return {
            toggleWikiLink: () => ({ chain, state }) => {
                if (state.selection.empty) return false;
                const text = state.doc.textBetween(state.selection.from, state.selection.to);
                // Vi trimmer også her for en sikkerheds skyld, hvis man linker en markering med mellemrum
                return chain().toggleMark(this.name, { target: text.trim() }).run();
            },
        };
    },

    addKeyboardShortcuts() {
        return {
            'Mod-k': () => this.editor.commands.toggleWikiLink(),
        };
    },

    addInputRules() {
        return [
            new InputRule({
                find: /\[\[([^\]]+)\]\]$/, 
                handler: ({ state, range, match }) => {
                    const { tr } = state;
                    const start = range.from;
                    const end = range.to;
                    
                    // RETTELSE: Tilføjet .trim() her
                    // Dette fjerner utilsigtede mellemrum før/efter teksten (f.eks. "Link ")
                    const text = match[1].trim();

                    tr.replaceWith(start, end, state.schema.text(text));
                    tr.addMark(start, start + text.length, state.schema.marks.wikiLink.create({ target: text }));
                },
            }),
        ];
    },
});