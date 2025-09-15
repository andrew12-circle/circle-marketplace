'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditMode } from '@/contexts/EditModeContext';
import { supabase } from '@/integrations/supabase/client';

type Target = {
  el: HTMLElement;
  id: string;
  entity: string;
  field: string;
  type: 'text' | 'textarea';
  label: string;
};

export function InlineInspector() {
  const { isEdit } = useEditMode();
  const [targets, setTargets] = useState<Target[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isEdit) { setTargets([]); return; }

    function scan() {
      const list: Target[] = [];
      document.querySelectorAll<HTMLElement>('[data-editable]').forEach((el) => {
        const entity = el.dataset.entity || 'services';
        const id = el.dataset.id || '';
        const field = el.dataset.field || '';
        const type = (el.dataset.type as any) || 'text';
        const label = el.dataset.label || `${entity}.${field}`;
        if (id && field) list.push({ el, id, entity, field, type, label });
      });
      setTargets(list);
    }

    scan();
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });
    const ro = new ResizeObserver(() => setTick(t => t + 1));
    ro.observe(document.documentElement);

    const onScroll = () => setTick(t => t + 1);
    window.addEventListener('scroll', onScroll, true);

    return () => { mo.disconnect(); ro.disconnect(); window.removeEventListener('scroll', onScroll, true); };
  }, [isEdit]);

  if (!isEdit) return null;

  return createPortal(
    <>
      {targets.map(t => <Pencil key={`${t.entity}:${t.id}:${t.field}`} t={t} />)}
      <Ribbon />
    </>,
    document.body
  );
}

function Ribbon() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 32,
      background: 'rgba(255,140,0,0.9)', color: '#111', fontSize: 12,
      display: 'flex', alignItems: 'center', padding: '0 10px', zIndex: 2147483647
    }}>
      🔧 Edit Mode active. Hover content to reveal pencils. Press Ctrl+E to toggle.
    </div>
  );
}

function Pencil({ t }: { t: Target }) {
  const rect = t.el.getBoundingClientRect();
  const top = window.scrollY + rect.top - 10;
  const left = window.scrollX + rect.left + rect.width - 10;

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditor(t); }}
        style={{
          position: 'absolute',
          top, left,
          transform: 'translate(-100%, -100%)',
          zIndex: 2147483647,
          opacity: 0.9,
          padding: '2px 6px',
          borderRadius: 12,
          border: '1px solid #ddd',
          background: '#fff',
          cursor: 'pointer',
          pointerEvents: 'auto'
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={`Edit ${t.label}`}
      >✎</button>
      <Highlight rect={rect} />
    </>
  );
}

function Highlight({ rect }: { rect: DOMRect }) {
  return (
    <div style={{
      position: 'absolute',
      top: window.scrollY + rect.top,
      left: window.scrollX + rect.left,
      width: rect.width,
      height: rect.height,
      outline: '2px dashed rgba(255,140,0,0.6)',
      pointerEvents: 'none',
      zIndex: 2147483646
    }} />
  );
}

// simple singleton editor
let editorDiv: HTMLDivElement | null = null;
function openEditor(t: Target) {
  if (!editorDiv) {
    editorDiv = document.createElement('div');
    document.body.appendChild(editorDiv);
  }
  const current = readValue(t.el);
  const label = t.label;

  editorDiv.innerHTML = `
    <div style="position:fixed;top:32px;right:0;height:calc(100% - 32px);width:420px;background:#fff;border-left:1px solid #e5e7eb;box-shadow:-4px 0 20px rgba(0,0,0,0.08);z-index:2147483647;padding:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <strong style="font-size:14px">Edit: ${escapeHtml(label)}</strong>
        <button id="ie-close" type="button">✕</button>
      </div>
      ${t.type === 'textarea'
        ? `<textarea id="ie-input" style="width:100%;height:320px;border:1px solid #d1d5db;padding:8px">${escapeHtml(current)}</textarea>`
        : `<input id="ie-input" style="width:100%;border:1px solid #d1d5db;padding:8px" value="${escapeHtml(current)}" />`
      }
      <div style="margin-top:12px;display:flex;gap:8px">
        <button id="ie-save" type="button" style="border:1px solid #d1d5db;padding:6px 12px;border-radius:6px">Save</button>
        <span id="ie-status" style="font-size:12px;opacity:0.7"></span>
      </div>
    </div>
  `;

  const closeBtn = editorDiv.querySelector('#ie-close') as HTMLButtonElement;
  const saveBtn = editorDiv.querySelector('#ie-save') as HTMLButtonElement;
  const inputEl = editorDiv.querySelector('#ie-input') as HTMLInputElement | HTMLTextAreaElement;
  const statusEl = editorDiv.querySelector('#ie-status') as HTMLSpanElement;

  closeBtn.onclick = () => editorDiv && (editorDiv.innerHTML = '');

  saveBtn.onclick = async () => {
    saveBtn.disabled = true;
    statusEl.textContent = 'saving…';
    try {
      const newVal = inputEl.value;
      await saveField(t.entity, t.id, t.field, newVal);
      writeValue(t.el, newVal);
      statusEl.textContent = 'saved';
      setTimeout(() => closeBtn.click(), 300);
      // notify app if you want state updates
      window.dispatchEvent(new CustomEvent('inlineEdit:saved', { detail: { entity: t.entity, id: t.id, field: t.field, value: newVal } }));
    } catch (e) {
      statusEl.textContent = 'error';
      saveBtn.disabled = false;
    }
  };
}

function readValue(el: HTMLElement) {
  return el.dataset.value ?? el.textContent ?? '';
}
function writeValue(el: HTMLElement, val: string) {
  el.dataset.value = val;
  el.textContent = val;
}
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
async function saveField(entity: string, id: string, field: string, value: any) {
  const { error } = await supabase.from(entity).update({ [field]: value }).eq('id', id);
  if (error) throw error;
}