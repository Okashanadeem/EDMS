import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  AlignLeft, AlignCenter, AlignRight, 
  List, ListOrdered, Undo, Redo 
} from 'lucide-react';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const btnClass = (active) => `p-2 rounded hover:bg-indigo-100 transition-colors ${active ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}`;

  return (
    <div className="flex flex-wrap items-center gap-1 pb-4 mb-4 border-b border-slate-200">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive('bold'))}
        title="Bold"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive('italic'))}
        title="Italic"
      >
        <Italic size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btnClass(editor.isActive('underline'))}
        title="Underline"
      >
        <UnderlineIcon size={18} />
      </button>

      <div className="w-px h-6 bg-slate-200 mx-1" />

      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={btnClass(editor.isActive({ textAlign: 'left' }))}
        title="Align Left"
      >
        <AlignLeft size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={btnClass(editor.isActive({ textAlign: 'center' }))}
        title="Align Center"
      >
        <AlignCenter size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={btnClass(editor.isActive({ textAlign: 'right' }))}
        title="Align Right"
      >
        <AlignRight size={18} />
      </button>

      <div className="w-px h-6 bg-slate-200 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive('bulletList'))}
        title="Bullet List"
      >
        <List size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive('orderedList'))}
        title="Ordered List"
      >
        <ListOrdered size={18} />
      </button>

      <div className="w-px h-6 bg-slate-200 mx-1" />

      <button
        onClick={() => editor.chain().focus().undo().run()}
        className={btnClass()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        className={btnClass()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo size={18} />
      </button>
    </div>
  );
};

const RichTextEditor = ({ content, onChange, readOnly = false }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[500px] w-full',
      },
    },
  });

  // Keep editor content in sync with external content prop
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {!readOnly && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
