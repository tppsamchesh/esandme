"use client";

import { saveNavLinks } from "@/app/admin/settings/actions";
import type { NavLink } from "@/app/admin/settings/_lib/fetch-site-settings";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

function newKey() {
  return `nav-${crypto.randomUUID()}`;
}

function SortableRow({
  item,
  onChange,
  onRemove,
}: {
  item: NavLink;
  onChange: (patch: Partial<NavLink>) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-start gap-2 rounded-lg border border-brand-text/10 bg-brand-bg/50 p-3"
    >
      <button
        type="button"
        className="mt-2 cursor-grab touch-none rounded px-1 text-brand-text/50 active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <div className="grid flex-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-brand-text/60">Label</span>
          <input
            value={item.label ?? ""}
            onChange={(e) => onChange({ label: e.target.value })}
            className="mt-1 w-full rounded-md border border-brand-text/20 bg-white px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs text-brand-text/60">Link (href)</span>
          <input
            value={item.href ?? ""}
            onChange={(e) => onChange({ href: e.target.value })}
            className="mt-1 w-full rounded-md border border-brand-text/20 bg-white px-2 py-1.5 font-mono text-sm"
            placeholder="/collections/..."
          />
        </label>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-7 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800 hover:bg-red-100"
      >
        Remove
      </button>
    </div>
  );
}

export function NavLinksEditor({
  documentId,
  initialNav,
}: {
  documentId: string | null;
  initialNav: NavLink[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState<NavLink[]>(() =>
    initialNav.length > 0 ? initialNav : []
  );
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const initialSig = JSON.stringify(initialNav);
  useEffect(() => {
    try {
      const parsed = JSON.parse(initialSig) as NavLink[];
      setItems(parsed.length > 0 ? parsed.map((i) => ({ ...i })) : []);
    } catch {
      setItems([]);
    }
  }, [initialSig]);

  const ids = useMemo(() => items.map((i) => i._key), [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i._key === active.id);
    const newIndex = items.findIndex((i) => i._key === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setItems(arrayMove(items, oldIndex, newIndex));
  }

  function updateItem(key: string, patch: Partial<NavLink>) {
    setItems((prev) =>
      prev.map((i) => (i._key === key ? { ...i, ...patch } : i))
    );
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i._key !== key));
  }

  function addItem() {
    setItems((prev) => [...prev, { _key: newKey(), label: "", href: "/" }]);
  }

  function handleSave() {
    setError(null);
    setOk(false);
    startTransition(async () => {
      const res = await saveNavLinks({ documentId, nav: items });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOk(true);
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-brand-text/10 bg-white p-6 shadow-sm">
      <h2 className="font-heading text-xl text-brand-text">Navigation</h2>
      <p className="mt-1 text-sm text-brand-text/65">
        Drag links to reorder. Labels and URLs match the public header.
      </p>

      <div className="mt-6 space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <SortableRow
                key={item._key}
                item={item}
                onChange={(patch) => updateItem(item._key, patch)}
                onRemove={() => removeItem(item._key)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {items.length === 0 ? (
          <p className="text-sm text-brand-text/60">No links yet.</p>
        ) : null}

        <button
          type="button"
          onClick={addItem}
          className="rounded-md border border-brand-primary/40 bg-brand-bg px-3 py-1.5 text-sm font-medium text-brand-primary hover:bg-brand-primary/10"
        >
          Add link
        </button>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="mt-4 text-sm text-green-800">Saved.</p>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="mt-6 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save navigation"}
      </button>
    </section>
  );
}
