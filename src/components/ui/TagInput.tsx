'use client';

import { useState } from 'react';
import { X, Hash, Plus } from 'lucide-react';

interface TagInputProps {
  label?: string;
  helperText?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({
  label = 'Tags / Hashtag',
  helperText = 'Ketik tag lalu tekan Enter atau koma (contoh: zeolite, pupuk-organik)',
  tags = [],
  onChange,
  placeholder = 'Tambah tag hashtag...',
}: TagInputProps) {
  const [inputVal, setInputVal] = useState('');

  const addTag = (rawText: string) => {
    const cleanTag = rawText
      .trim()
      .toLowerCase()
      .replace(/^#+/, '')
      .replace(/[^\w\-]+/g, '');

    if (!cleanTag) return;

    if (!tags.includes(cleanTag)) {
      onChange([...tags, cleanTag]);
    }
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
        </label>
        <span className="text-[11px] text-slate-400">{helperText}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-surface-300 bg-white p-2 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 transition-all min-h-[44px]">
        {/* Render chips */}
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200/80 animate-in fade-in"
          >
            <Hash className="h-3 w-3 text-emerald-600" />
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded p-0.5 hover:bg-emerald-200/60 text-emerald-600 transition-colors ml-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {/* Input field */}
        <div className="flex-1 flex items-center min-w-[140px]">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputVal.trim()) addTag(inputVal);
            }}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="w-full bg-transparent px-1 py-0.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {inputVal.trim() && (
            <button
              type="button"
              onClick={() => addTag(inputVal)}
              className="flex-shrink-0 text-emerald-600 hover:text-emerald-700 p-1"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
