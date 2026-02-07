import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
    BookIcon, SwordIcon, DiceIcon, // Brug dine eksisterende ikoner eller lav simple placeholders
} from '../CampaignManager/components/CampaignIcons';

// Hvis du mangler ikoner, kan du lave simple SVG'er her eller importere dem
const H1Icon = () => <span className="font-serif font-bold text-xs">H1</span>;
const H2Icon = () => <span className="font-serif font-bold text-xs">H2</span>;
const ListIcon = () => <span className="font-bold text-xs">•</span>;

export const SlashMenu = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Definer kommandoerne her
  const items = [
    {
      title: 'Heading 1',
      description: 'Big section header',
      icon: <H1Icon />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
      },
    },
    {
      title: 'Heading 2',
      description: 'Sub-section header',
      icon: <H2Icon />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
      },
    },
    {
      title: 'Bullet List',
      description: 'Create a simple list',
      icon: <ListIcon />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: 'Divider',
      description: 'Horizontal line',
      icon: <span className="text-xs">―</span>,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
        title: 'Roll Dice',
        description: 'Insert [1d20]',
        icon: <span className="text-xs font-bold">D20</span>,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertContent(' [1d20] ').run();
        },
      },
  ];

  const selectItem = (index) => {
    const item = items[index];
    if (item) {
      item.command(props);
    }
  };

  useEffect(() => setSelectedIndex(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden min-w-[200px] flex flex-col p-1">
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => selectItem(index)}
          className={`flex items-center gap-3 px-3 py-2 text-left rounded text-sm transition-colors ${
            index === selectedIndex ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <div className={`w-6 h-6 flex items-center justify-center rounded border ${index === selectedIndex ? 'border-amber-400 bg-amber-700' : 'border-slate-600 bg-slate-800'}`}>
            {item.icon}
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-none">{item.title}</span>
            <span className={`text-[10px] leading-none mt-1 ${index === selectedIndex ? 'text-amber-200' : 'text-slate-500'}`}>{item.description}</span>
          </div>
        </button>
      ))}
    </div>
  );
});