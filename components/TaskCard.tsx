"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Task = {
  title: string;
  deadline: string;
  assignee: string;
  detail: string;
};

type TaskCardProps = {
  id: string;
  task: Task;
  onDelete?: (id: string) => void;
};

export default function TaskCard({ id, task, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 180ms ease",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="soft-card cursor-grab rounded-2xl p-3 text-sm text-stone-800 will-change-transform transition hover:-translate-y-0.5 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="font-medium tracking-tight">{task.title}</div>
        {onDelete && (
          <button
            type="button"
            className="shrink-0 rounded-full bg-stone-200 px-2 py-1 text-[11px] font-medium text-stone-600 transition hover:bg-red-100 hover:text-red-700"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(id);
            }}
          >
            Delete
          </button>
        )}
      </div>

      {task.detail && (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-600">
          {task.detail}
        </p>
      )}

      {task.deadline && (
        <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            D
          </span>
          <span>{task.deadline}</span>
        </div>
      )}

      {task.assignee && (
        <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            A
          </span>
          <span>{task.assignee}</span>
        </div>
      )}
    </div>
  );
}
