'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Minus, Link2,
  Image as ImageIcon, Heading1, Heading2, Heading3,
  Undo2, Redo2, RemoveFormatting, Type, Loader2,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  theme?: 'dark' | 'light';
  minHeight?: number;
  uploadEndpoint?: string;
}

const PRESET_COLORS = [
  '#ffffff','#f1f5f9','#94a3b8','#475569','#1e293b',
  '#fbbf24','#f97316','#ef4444','#ec4899','#c026d3',
  '#22c55e','#10b981','#06b6d4','#3b82f6','#8b5cf6','#000000',
];

function Btn({ onClick, active, disabled, title, children, isDark = true }: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode; isDark?: boolean;
}) {
  return (
    <button type="button" onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled} title={title}
      className={[
        'flex h-7 w-7 items-center justify-center rounded-lg text-xs transition-all flex-shrink-0',
        active
          ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
          : isDark
            ? 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-100'
            : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900',
        disabled ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
      ].join(' ')}>
      {children}
    </button>
  );
}
function Sep({ isDark = true }: { isDark?: boolean }) {
  return <div className={`w-px h-5 mx-0.5 flex-shrink-0 ${isDark ? 'bg-slate-700/70' : 'bg-slate-300'}`} />;
}

export function RichTextEditor({
  value, onChange, placeholder = 'Mulai menulis konten...', theme = 'dark', minHeight = 220, uploadEndpoint = '/api/admin/upload',
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      Image.configure({ inline: false, allowBase64: false, HTMLAttributes: { class: 'max-w-full rounded-lg my-3' } }),
      Underline,
      Placeholder.configure({ placeholder }),
      TextStyle,
      Color,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
    editorProps: {
      attributes: { class: 'focus:outline-none px-4 py-3' },
    },
  });

  // Sync external value
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const cur = editor.getHTML();
    const normalized = cur === '<p></p>' ? '' : cur;
    if ((value || '') !== normalized) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value]); // eslint-disable-line

  // Close color picker on outside click
  useEffect(() => {
    if (!showColor) return;
    const handler = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setShowColor(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showColor]);

  const handleLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('URL Link (kosongkan untuk hapus):', prev);
    if (url === null) return;
    if (!url) { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const handleUpload = useCallback(async (file: File) => {
    if (!editor || uploading) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(uploadEndpoint, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) { editor.chain().focus().setImage({ src: data.url, alt: file.name }).run(); }
      else { alert(data.error || 'Gagal upload gambar'); }
    } catch { alert('Gagal upload. Coba lagi.'); }
    finally { setUploading(false); }
  }, [editor, uploading, uploadEndpoint]);

  if (!editor) return <div className={`h-32 rounded-2xl border animate-pulse ${theme === 'dark' ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`} />;

  const curColor = editor.getAttributes('textStyle').color || '#22c55e';

  return (
    <div className={`rounded-2xl border overflow-hidden ${theme === 'dark' ? 'border-slate-700 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
      {/* Toolbar */}
      <div className={`flex flex-wrap items-center gap-0.5 p-2 border-b ${theme === 'dark' ? 'border-slate-700 bg-slate-800/70' : 'border-slate-200 bg-slate-50'}`}>
        <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo2 className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo2 className="h-3.5 w-3.5" /></Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} title="Paragraf"><Type className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 className="h-3.5 w-3.5" /></Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)"><Bold className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)"><Italic className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)"><UnderlineIcon className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough className="h-3.5 w-3.5" /></Btn>
        {/* Color picker */}
        <div className="relative" ref={colorRef}>
          <Btn onClick={() => setShowColor(!showColor)} title="Warna Teks" active={showColor}>
            <span className="flex flex-col items-center gap-[2px]">
              <span className="text-[9px] font-black leading-none text-slate-200">A</span>
              <span className="h-[3px] w-4 rounded-full" style={{ backgroundColor: curColor }} />
            </span>
          </Btn>
          {showColor && (
            <div className={`absolute top-full left-0 mt-1 z-50 rounded-xl border p-2.5 shadow-xl ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
              <div className="grid grid-cols-8 gap-1">
                {PRESET_COLORS.map((c) => (
                  <button key={c} type="button" title={c}
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c).run(); setShowColor(false); }}
                    className="h-5 w-5 rounded-md border border-white/10 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }} />
                ))}
                <button type="button" title="Hapus warna"
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setShowColor(false); }}
                  className="h-5 w-5 rounded-md border border-slate-500 text-slate-400 text-[9px] flex items-center justify-center hover:scale-110 transition-transform">
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
        <Sep />
        <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Rata Kiri"><AlignLeft className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Rata Tengah"><AlignCenter className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Rata Kanan"><AlignRight className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Rata Kanan-Kiri"><AlignJustify className="h-3.5 w-3.5" /></Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List"><ListOrdered className="h-3.5 w-3.5" /></Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Kutipan"><Quote className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Garis Pemisah"><Minus className="h-3.5 w-3.5" /></Btn>
        <Sep />
        <Btn onClick={handleLink} active={editor.isActive('link')} title="Tambah/Hapus Link"><Link2 className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Upload Gambar ke Server">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
        </Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Hapus Semua Format"><RemoveFormatting className="h-3.5 w-3.5" /></Btn>
      </div>

      {/* Editor area */}
      <div
        style={{ minHeight }}
        className={[
          'cursor-text',
          theme === 'dark' ? 'text-slate-100' : 'text-slate-900',
          '[&_.tiptap]:min-h-[inherit] [&_.tiptap]:focus:outline-none [&_.tiptap]:px-4 [&_.tiptap]:py-3 [&_.tiptap]:text-sm [&_.tiptap]:leading-relaxed',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:text-slate-400 [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child::before]:h-0',
          '[&_.tiptap_h1]:text-2xl [&_.tiptap_h1]:font-extrabold [&_.tiptap_h1]:mt-4 [&_.tiptap_h1]:mb-2',
          '[&_.tiptap_h2]:text-xl [&_.tiptap_h2]:font-bold [&_.tiptap_h2]:mt-3 [&_.tiptap_h2]:mb-2',
          '[&_.tiptap_h3]:text-lg [&_.tiptap_h3]:font-semibold [&_.tiptap_h3]:mt-3 [&_.tiptap_h3]:mb-1',
          '[&_.tiptap_p]:mb-2',
          '[&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ul]:mb-2',
          '[&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_ol]:mb-2',
          '[&_.tiptap_li]:mb-0.5',
          '[&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-emerald-500 [&_.tiptap_blockquote]:pl-4 [&_.tiptap_blockquote]:italic [&_.tiptap_blockquote]:my-3',
          theme === 'dark'
            ? '[&_.tiptap_blockquote]:text-slate-400 [&_.tiptap_hr]:border-slate-600 [&_.tiptap_code]:bg-slate-700/80 [&_.tiptap_code]:text-emerald-300 [&_.tiptap_pre]:bg-slate-800 [&_.tiptap_a]:text-emerald-400'
            : '[&_.tiptap_blockquote]:text-slate-500 [&_.tiptap_hr]:border-slate-300 [&_.tiptap_code]:bg-emerald-50 [&_.tiptap_code]:text-emerald-700 [&_.tiptap_pre]:bg-slate-100 [&_.tiptap_a]:text-emerald-600',
          '[&_.tiptap_hr]:my-4',
          '[&_.tiptap_code]:rounded [&_.tiptap_code]:px-1 [&_.tiptap_code]:font-mono [&_.tiptap_code]:text-xs',
          '[&_.tiptap_pre]:rounded-xl [&_.tiptap_pre]:p-4 [&_.tiptap_pre]:my-3 [&_.tiptap_pre]:overflow-x-auto [&_.tiptap_pre_code]:text-xs',
          '[&_.tiptap_a]:underline [&_.tiptap_a]:underline-offset-2',
          '[&_.tiptap_img]:max-w-full [&_.tiptap_img]:rounded-xl [&_.tiptap_img]:my-3',
          '[&_.tiptap_strong]:font-bold [&_.tiptap_em]:italic [&_.tiptap_u]:underline [&_.tiptap_s]:line-through',
        ].join(' ')}
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleUpload(f); e.target.value = ''; } }} />
    </div>
  );
}
