"use client";

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  pointerWithin,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import TaskCard from "@/components/TaskCard";
import { supabase } from "@/lib/supabase";

type TaskStatus = "todo" | "inProgress" | "urgent" | "done";

type Task = {
  id: string;
  title: string;
  deadline: string;
  assignee: string;
  detail: string;
};

type TaskRow = {
  id: string;
  board_id: string;
  title: string;
  deadline: string | null;
  assignee: string | null;
  detail: string | null;
  status: TaskStatus;
  position: number;
};

type BoardRow = {
  id: string;
  name: string;
  owner_id: string;
};

type BoardMemberRow = {
  board_id: string;
  user_id: string;
  role: "owner" | "member";
};

type ProfileRow = {
  id: string;
  email: string;
};

type BoardSummary = {
  id: string;
  name: string;
  ownerId: string;
  role: "owner" | "member";
};

type MemberSummary = {
  id: string;
  email: string;
  role: "owner" | "member";
};

type Columns = Record<TaskStatus, Task[]>;

type TaskWithColumn = Task & {
  columnKey: TaskStatus;
};

type ColumnProps = {
  columnKey: TaskStatus;
  label: string;
  tasks: Task[];
  activeColumn: TaskStatus | null;
  setActiveColumn: Dispatch<SetStateAction<TaskStatus | null>>;
  title: string;
  setTitle: (value: string) => void;
  deadline: string;
  setDeadline: (value: string) => void;
  assignee: string;
  setAssignee: (value: string) => void;
  detail: string;
  setDetail: (value: string) => void;
  addTask: () => void;
  deleteTask: (id: string) => void;
};

const createEmptyColumns = (): Columns => ({
  todo: [],
  inProgress: [],
  urgent: [],
  done: [],
});

function Column({
  columnKey,
  label,
  tasks,
  activeColumn,
  setActiveColumn,
  title,
  setTitle,
  deadline,
  setDeadline,
  assignee,
  setAssignee,
  detail,
  setDetail,
  addTask,
  deleteTask,
}: ColumnProps) {
  const { setNodeRef } = useDroppable({ id: columnKey });

  const columnStyles: Record<
    TaskStatus,
    { dot: string; accent: string; button: string; border: string }
  > = {
    todo: {
      dot: "bg-sky-500",
      accent: "text-sky-700",
      button: "text-sky-700 hover:text-sky-800",
      border: "border-sky-100",
    },
    inProgress: {
      dot: "bg-amber-500",
      accent: "text-amber-700",
      button: "text-amber-700 hover:text-amber-800",
      border: "border-amber-100",
    },
    urgent: {
      dot: "bg-rose-500",
      accent: "text-rose-700",
      button: "text-rose-700 hover:text-rose-800",
      border: "border-rose-100",
    },
    done: {
      dot: "bg-emerald-500",
      accent: "text-emerald-700",
      button: "text-emerald-700 hover:text-emerald-800",
      border: "border-emerald-100",
    },
  };

  const styles = columnStyles[columnKey];

  return (
    <div
      ref={setNodeRef}
      className={`glass-panel w-full rounded-[1.75rem] border p-4 sm:p-5 ${styles.border}`}
    >
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
          <h2 className="text-sm font-semibold uppercase tracking-[0.26em] text-stone-500">
            {label}
          </h2>
        </div>
        <p className={`mt-2 text-xs ${styles.accent}`}>
          {tasks.length} task{tasks.length === 1 ? "" : "s"}
        </p>
      </div>

      <button
        className={`mb-3 text-sm font-medium transition ${styles.button}`}
        onClick={() =>
          setActiveColumn((current) => (current === columnKey ? null : columnKey))
        }
      >
        + Add a card
      </button>

      {activeColumn === columnKey && (
        <div className="soft-card mb-4 space-y-3 rounded-3xl p-3">
          <input
            className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            placeholder="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <input
            className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
          />

          <input
            className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            placeholder="Assignee"
            value={assignee}
            onChange={(event) => setAssignee(event.target.value)}
          />

          <textarea
            className="min-h-24 w-full resize-none rounded-2xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            placeholder="Add a short detail or note"
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
          />

          <button
            className="w-full rounded-2xl bg-stone-900 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
            onClick={addTask}
          >
            Add
          </button>
        </div>
      )}

      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="mt-2 min-h-[150px] space-y-3">
          {tasks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white/45 px-4 py-8 text-center text-sm text-stone-500">
              Drop a task here or create a new one for this lane.
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                id={task.id}
                task={task}
                onDelete={deleteTask}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function mapRowsToColumns(rows: TaskRow[]): Columns {
  const next = createEmptyColumns();

  rows
    .sort((a, b) => {
      if (a.status !== b.status) {
        return a.status.localeCompare(b.status);
      }
      return a.position - b.position;
    })
    .forEach((row) => {
      next[row.status].push({
        id: row.id,
        title: row.title,
        deadline: row.deadline ?? "",
        assignee: row.assignee ?? "",
        detail: row.detail ?? "",
      });
    });

  return next;
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
}

async function ensureProfile(currentUser: User) {
  const email = currentUser.email?.trim().toLowerCase();
  if (!email) return;

  await supabase.from("profiles").upsert({
    id: currentUser.id,
    email,
  });
}

async function createStarterBoard(currentUser: User) {
  const emailPrefix = currentUser.email?.split("@")[0] ?? "My";
  const boardName = `${emailPrefix}'s Board`;

  const { data: boardData, error: boardError } = await supabase
    .from("boards")
    .insert({
      name: boardName,
      owner_id: currentUser.id,
    })
    .select("id, name, owner_id")
    .single();

  if (boardError) {
    throw boardError;
  }

  const board = boardData as BoardRow;

  const { error: memberError } = await supabase.from("board_members").insert({
    board_id: board.id,
    user_id: currentUser.id,
    role: "owner",
  });

  if (memberError) {
    throw memberError;
  }
}

async function fetchBoards(currentUser: User): Promise<BoardSummary[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from("board_members")
    .select("board_id, user_id, role")
    .eq("user_id", currentUser.id);

  if (membershipError) {
    throw membershipError;
  }

  const membershipRows = (memberships ?? []) as BoardMemberRow[];

  if (membershipRows.length === 0) {
    await createStarterBoard(currentUser);
    return fetchBoards(currentUser);
  }

  const boardIds = membershipRows.map((membership) => membership.board_id);

  const { data: boardData, error: boardError } = await supabase
    .from("boards")
    .select("id, name, owner_id")
    .in("id", boardIds);

  if (boardError) {
    throw boardError;
  }

  return ((boardData ?? []) as BoardRow[])
    .map((board) => {
      const membership = membershipRows.find(
        (item) => item.board_id === board.id
      );

      if (!membership) return null;

      return {
        id: board.id,
        name: board.name,
        ownerId: board.owner_id,
        role: membership.role,
      } satisfies BoardSummary;
    })
    .filter((board): board is BoardSummary => Boolean(board))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchMembers(boardId: string): Promise<MemberSummary[]> {
  const { data: membershipData, error: membershipError } = await supabase
    .from("board_members")
    .select("board_id, user_id, role")
    .eq("board_id", boardId);

  if (membershipError) {
    throw membershipError;
  }

  const membershipRows = (membershipData ?? []) as BoardMemberRow[];

  if (membershipRows.length === 0) {
    return [];
  }

  const userIds = membershipRows.map((member) => member.user_id);
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", userIds);

  if (profileError) {
    throw profileError;
  }

  const profileRows = (profileData ?? []) as ProfileRow[];

  return membershipRows
    .map((member) => {
      const profile = profileRows.find((item) => item.id === member.user_id);

      return {
        id: member.user_id,
        email: profile?.email ?? "Unknown user",
        role: member.role,
      } satisfies MemberSummary;
    })
    .sort((a, b) => a.email.localeCompare(b.email));
}

async function fetchTasks(boardId: string): Promise<Columns> {
  const { data, error: taskError } = await supabase
    .from("tasks")
    .select("id, board_id, title, deadline, assignee, detail, status, position")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  if (taskError) {
    throw taskError;
  }

  return mapRowsToColumns((data ?? []) as TaskRow[]);
}

export default function BoardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberSummary[]>([]);

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isBoardLoading, setIsBoardLoading] = useState(false);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [isInvitingMember, setIsInvitingMember] = useState(false);
  const [isBoardsPanelOpen, setIsBoardsPanelOpen] = useState(false);
  const [error, setError] = useState("");

  const [columns, setColumns] = useState<Columns>(createEmptyColumns());
  const [activeColumn, setActiveColumn] = useState<TaskStatus | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignee, setAssignee] = useState("");
  const [detail, setDetail] = useState("");
  const [newBoardName, setNewBoardName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");

  const columnLabels: Record<TaskStatus, string> = {
    todo: "To-Do",
    inProgress: "In Progress",
    urgent: "Urgent",
    done: "Done",
  };

  const selectedBoard = useMemo(
    () => boards.find((board) => board.id === selectedBoardId) ?? null,
    [boards, selectedBoardId]
  );

  const allTasksSortedByDeadline = useMemo<TaskWithColumn[]>(() => {
    return (Object.entries(columns) as [TaskStatus, Task[]][])
      .flatMap(([columnKey, tasks]) =>
        tasks
          .filter((task) => task.deadline)
          .map((task) => ({
            ...task,
            columnKey,
          }))
      )
      .sort(
        (a, b) =>
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );
  }, [columns]);

  const totalTasks = useMemo(
    () => Object.values(columns).flat().length,
    [columns]
  );

  const resetTaskForm = () => {
    setTitle("");
    setDeadline("");
    setAssignee("");
    setDetail("");
    setActiveColumn(null);
  };

  const getDeadlineStatus = (value: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(value);
    dueDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return { label: "Overdue", className: "bg-red-100 text-red-700" };
    }

    if (diffDays === 0) {
      return { label: "Today", className: "bg-orange-100 text-orange-700" };
    }

    if (diffDays <= 3) {
      return { label: "Soon", className: "bg-yellow-100 text-yellow-700" };
    }

    return { label: "Planned", className: "bg-blue-100 text-blue-700" };
  };

  const findColumnOfTask = (
    taskId: string,
    currentColumns: Columns
  ): TaskStatus | null => {
    for (const col of Object.keys(currentColumns) as TaskStatus[]) {
      if (currentColumns[col].some((task) => task.id === taskId)) {
        return col;
      }
    }

    return null;
  };

  const persistBoard = async (nextColumns: Columns) => {
    if (!selectedBoardId) return;

    const payload = (Object.entries(nextColumns) as [TaskStatus, Task[]][])
      .flatMap(([status, tasks]) =>
        tasks.map((task, position) => ({
          id: task.id,
          board_id: selectedBoardId,
          title: task.title,
          deadline: task.deadline || null,
          assignee: task.assignee || "",
          detail: task.detail || "",
          status,
          position,
        }))
      );

    const { error: upsertError } = await supabase
      .from("tasks")
      .upsert(payload, { onConflict: "id" });

    if (upsertError) {
      setError(upsertError.message);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsPageLoading(true);
      setError("");

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError(userError.message);
        setIsPageLoading(false);
        return;
      }

      if (!currentUser) {
        router.push("/");
        return;
      }

      setUser(currentUser);

      try {
        await ensureProfile(currentUser);
        const nextBoards = await fetchBoards(currentUser);
        setBoards(nextBoards);
        setSelectedBoardId((current) => {
          if (current && nextBoards.some((board) => board.id === current)) {
            return current;
          }

          return nextBoards[0]?.id ?? null;
        });
      } catch (loadError) {
        setError(getErrorMessage(loadError, "Board loading failed."));
      } finally {
        setIsPageLoading(false);
      }
    };

    loadInitialData();
  }, [router]);

  useEffect(() => {
    if (!selectedBoardId) return;

    const loadBoardData = async () => {
      setIsBoardLoading(true);
      setError("");

      try {
        resetTaskForm();
        const [nextColumns, nextMembers] = await Promise.all([
          fetchTasks(selectedBoardId),
          fetchMembers(selectedBoardId),
        ]);
        setColumns(nextColumns);
        setMembers(nextMembers);
      } catch (loadError) {
        setError(getErrorMessage(loadError, "Board data failed to load."));
      } finally {
        setIsBoardLoading(false);
      }
    };

    loadBoardData();
  }, [selectedBoardId]);

  useEffect(() => {
    if (!isBoardsPanelOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsBoardsPanelOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isBoardsPanelOpen]);

  const addTask = async () => {
    if (!title || !activeColumn || !selectedBoardId) return;

    setError("");

    const newRow = {
      board_id: selectedBoardId,
      title,
      deadline: deadline || null,
      assignee: assignee || "",
      detail: detail || "",
      status: activeColumn,
      position: columns[activeColumn].length,
    };

    const { data, error: insertError } = await supabase
      .from("tasks")
      .insert(newRow)
      .select("id, board_id, title, deadline, assignee, detail, status, position")
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    const inserted = data as TaskRow;

    setColumns((prev) => ({
      ...prev,
      [activeColumn]: [
        ...prev[activeColumn],
        {
          id: inserted.id,
          title: inserted.title,
          deadline: inserted.deadline ?? "",
          assignee: inserted.assignee ?? "",
          detail: inserted.detail ?? "",
        },
      ],
    }));

    resetTaskForm();
  };

  const deleteTask = async (taskId: string) => {
    const previousColumns = columns;
    const nextColumns = (Object.entries(columns) as [TaskStatus, Task[]][])
      .reduce<Columns>((acc, [status, tasks]) => {
        acc[status] = tasks.filter((task) => task.id !== taskId);
        return acc;
      }, createEmptyColumns());

    setColumns(nextColumns);

    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (deleteError) {
      setColumns(previousColumns);
      setError(deleteError.message);
      return;
    }

    await persistBoard(nextColumns);
  };

  const handleCreateBoard = async () => {
    if (!user || !newBoardName.trim()) return;

    setIsCreatingBoard(true);
    setError("");

    try {
      const { data: boardData, error: boardError } = await supabase
        .from("boards")
        .insert({
          name: newBoardName.trim(),
          owner_id: user.id,
        })
        .select("id, name, owner_id")
        .single();

      if (boardError) {
        throw boardError;
      }

      const board = boardData as BoardRow;

      const { error: memberError } = await supabase.from("board_members").insert({
        board_id: board.id,
        user_id: user.id,
        role: "owner",
      });

      if (memberError) {
        throw memberError;
      }

      setNewBoardName("");
      const nextBoards = await fetchBoards(user);
      setBoards(nextBoards);
      setSelectedBoardId(board.id);
    } catch (createError) {
      setError(getErrorMessage(createError, "Board could not be created."));
    } finally {
      setIsCreatingBoard(false);
    }
  };

  const handleInviteMember = async () => {
    if (!selectedBoardId || !memberEmail.trim()) return;

    setIsInvitingMember(true);
    setError("");

    try {
      const email = memberEmail.trim().toLowerCase();

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profileData) {
        throw new Error("No registered user found with that email.");
      }

      const { error: inviteError } = await supabase
        .from("board_members")
        .upsert(
          {
            board_id: selectedBoardId,
            user_id: profileData.id,
            role: "member",
          },
          { onConflict: "board_id,user_id" }
        );

      if (inviteError) {
        throw inviteError;
      }

      setMemberEmail("");
      const nextMembers = await fetchMembers(selectedBoardId);
      setMembers(nextMembers);
    } catch (inviteError) {
      setError(getErrorMessage(inviteError, "Member could not be invited."));
    } finally {
      setIsInvitingMember(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string;
    const sourceColumn = findColumnOfTask(activeId, columns);

    if (!sourceColumn) return;

    const task =
      columns[sourceColumn].find((item) => item.id === activeId) ?? null;

    setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const nextColumns = (() => {
      const sourceColumn = findColumnOfTask(activeId, columns);
      if (!sourceColumn) return null;

      const columnKeys = Object.keys(columns) as TaskStatus[];
      const targetColumn = columnKeys.includes(overId as TaskStatus)
        ? (overId as TaskStatus)
        : findColumnOfTask(overId, columns);

      if (!targetColumn) return null;

      const sourceTasks = columns[sourceColumn];
      const sourceIndex = sourceTasks.findIndex((task) => task.id === activeId);

      if (sourceIndex === -1) return null;

      const movedTask = sourceTasks[sourceIndex];

      if (sourceColumn === targetColumn) {
        const targetIndex = sourceTasks.findIndex((task) => task.id === overId);

        if (targetIndex === -1 || sourceIndex === targetIndex) {
          return null;
        }

        return {
          ...columns,
          [sourceColumn]: arrayMove(sourceTasks, sourceIndex, targetIndex),
        };
      }

      const targetTasks = columns[targetColumn];
      const overIsColumn = overId === targetColumn;
      const targetIndex = overIsColumn
        ? targetTasks.length
        : targetTasks.findIndex((task) => task.id === overId);

      const newSourceTasks = sourceTasks.filter((task) => task.id !== activeId);
      const newTargetTasks = [...targetTasks];

      newTargetTasks.splice(
        targetIndex < 0 ? targetTasks.length : targetIndex,
        0,
        movedTask
      );

      return {
        ...columns,
        [sourceColumn]: newSourceTasks,
        [targetColumn]: newTargetTasks,
      };
    })();

    if (!nextColumns) return;

    setColumns(nextColumns);
    await persistBoard(nextColumns);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (isPageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent text-stone-600">
        Loading shared workspace...
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto max-w-[1680px] rounded-[2rem] p-5 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-slate-200/80 bg-white/72 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Shared project workspace
              </span>
              <div className="space-y-3">
                <button
                  className="group inline-flex items-center gap-3 rounded-[1.6rem] border border-slate-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(241,247,252,0.72))] px-4 py-3 text-left text-slate-800 shadow-[0_14px_34px_rgba(102,125,158,0.08)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-slate-200 hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(237,244,250,0.84))] hover:shadow-[0_18px_38px_rgba(102,125,158,0.12)]"
                  onClick={() => setIsBoardsPanelOpen(true)}
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/70 bg-white/72 text-sm font-semibold text-sky-700 shadow-sm transition group-hover:bg-white/88">
                    Panel
                  </span>
                  <span className="block">
                    <span className="block text-sm font-semibold tracking-tight text-slate-800">
                      Open Boards Panel
                    </span>
                    <span className="block text-xs text-slate-500">
                      Switch boards, create new ones, and invite teammates
                    </span>
                  </span>
                </button>

                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {selectedBoard?.name ?? "TaskFlow Board"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  Boards can now be shared across teammates, so tasks belong to the
                  project instead of a single person.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white/72 px-4 py-3 text-sm text-slate-600 shadow-sm">
                <span className="font-medium text-slate-900">{totalTasks}</span>{" "}
                tasks in this board
              </div>
              {selectedBoard && (
                <div className="rounded-2xl border border-slate-200/80 bg-white/72 px-4 py-3 text-sm text-slate-600 shadow-sm">
                  Role:{" "}
                  <span className="font-medium capitalize text-slate-900">
                    {selectedBoard.role}
                  </span>
                </div>
              )}
              <button
                className="rounded-2xl border border-slate-200 bg-white/88 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-6 2xl:flex-row">
            <div className="min-w-0 flex-1">
              {isBoardLoading ? (
                <div className="glass-panel rounded-[1.75rem] px-6 py-14 text-center text-stone-600">
                  Loading board data...
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
                  <Column
                    columnKey="todo"
                    label="To-Do"
                    tasks={columns.todo}
                    activeColumn={activeColumn}
                    setActiveColumn={setActiveColumn}
                    title={title}
                    setTitle={setTitle}
                    deadline={deadline}
                    setDeadline={setDeadline}
                    assignee={assignee}
                    setAssignee={setAssignee}
                    detail={detail}
                    setDetail={setDetail}
                    addTask={addTask}
                    deleteTask={deleteTask}
                  />
                  <Column
                    columnKey="inProgress"
                    label="In Progress"
                    tasks={columns.inProgress}
                    activeColumn={activeColumn}
                    setActiveColumn={setActiveColumn}
                    title={title}
                    setTitle={setTitle}
                    deadline={deadline}
                    setDeadline={setDeadline}
                    assignee={assignee}
                    setAssignee={setAssignee}
                    detail={detail}
                    setDetail={setDetail}
                    addTask={addTask}
                    deleteTask={deleteTask}
                  />
                  <Column
                    columnKey="urgent"
                    label="Urgent"
                    tasks={columns.urgent}
                    activeColumn={activeColumn}
                    setActiveColumn={setActiveColumn}
                    title={title}
                    setTitle={setTitle}
                    deadline={deadline}
                    setDeadline={setDeadline}
                    assignee={assignee}
                    setAssignee={setAssignee}
                    detail={detail}
                    setDetail={setDetail}
                    addTask={addTask}
                    deleteTask={deleteTask}
                  />
                  <Column
                    columnKey="done"
                    label="Done"
                    tasks={columns.done}
                    activeColumn={activeColumn}
                    setActiveColumn={setActiveColumn}
                    title={title}
                    setTitle={setTitle}
                    deadline={deadline}
                    setDeadline={setDeadline}
                    assignee={assignee}
                    setAssignee={setAssignee}
                    detail={detail}
                    setDetail={setDetail}
                    addTask={addTask}
                    deleteTask={deleteTask}
                  />
                </div>
              )}
            </div>

            <aside className="glass-panel w-full rounded-[1.75rem] p-5 2xl:w-80">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.26em] text-stone-500">
                    Deadlines
                  </h2>
                  <p className="mt-2 text-sm text-stone-500">
                    Upcoming work sorted by due date.
                  </p>
                </div>
                <span className="rounded-full border border-white/80 bg-white/85 px-3 py-1 text-xs font-semibold text-stone-700">
                  {allTasksSortedByDeadline.length}
                </span>
              </div>

              {allTasksSortedByDeadline.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-stone-300 bg-white/45 px-4 py-8 text-center text-sm text-stone-500">
                  Add deadlines to tasks and they will show up here.
                </div>
              ) : (
                <div className="space-y-3">
                  {allTasksSortedByDeadline.map((task) => {
                    const badge = getDeadlineStatus(task.deadline);
                    const isUrgentLane = task.columnKey === "urgent";

                    return (
                      <div
                        key={task.id}
                        className={`soft-card rounded-3xl p-4 ${
                          isUrgentLane ? "ring-1 ring-rose-200" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm text-stone-900">
                            {task.title}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <p className="mt-3 text-xs text-stone-500">
                          Due {task.deadline}
                        </p>
                        <p className="mt-1 text-xs text-stone-600">
                          Column: {columnLabels[task.columnKey]}
                        </p>

                        {task.assignee && (
                          <p className="mt-1 text-xs text-stone-600">
                            Assignee: {task.assignee}
                          </p>
                        )}

                        {task.detail && (
                          <p className="mt-3 text-sm leading-6 text-stone-700">
                            {task.detail}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 transition ${
          isBoardsPanelOpen
            ? "pointer-events-auto bg-stone-950/22 opacity-100"
            : "pointer-events-none bg-transparent opacity-0"
        }`}
        onClick={() => setIsBoardsPanelOpen(false)}
      />

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-full max-w-sm p-2 transition duration-300 sm:p-4 ${
          isBoardsPanelOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="glass-panel flex h-full flex-col rounded-[1.75rem] p-4 sm:rounded-[2rem] sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5 sm:gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.26em] text-stone-500">
                Boards
              </h2>
              <p className="mt-2 text-xs leading-5 text-stone-600 sm:text-sm">
                Switch between projects or create a new shared board.
              </p>
            </div>
            <button
              className="rounded-full border border-stone-200 bg-white/80 px-3 py-2 text-xs text-stone-600 transition hover:bg-white sm:text-sm"
              onClick={() => setIsBoardsPanelOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1 sm:space-y-5">
            <div className="space-y-2">
              {boards.map((board) => (
                <button
                  key={board.id}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition sm:px-4 ${
                    board.id === selectedBoardId
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-white/80 text-stone-700 hover:bg-white"
                  }`}
                  onClick={() => {
                    setSelectedBoardId(board.id);
                    setIsBoardsPanelOpen(false);
                  }}
                >
                  <div className="font-medium">{board.name}</div>
                  <div
                    className={`mt-1 text-xs ${
                      board.id === selectedBoardId
                        ? "text-stone-200"
                        : "text-stone-500"
                    }`}
                  >
                    {board.role === "owner" ? "Owned by you" : "Shared with you"}
                  </div>
                </button>
              ))}
            </div>

            <div className="soft-card space-y-3 rounded-3xl p-3.5 sm:p-4">
              <p className="text-sm font-medium text-stone-800">Create board</p>
              <input
                className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                placeholder="Q2 Launch Plan"
                value={newBoardName}
                onChange={(event) => setNewBoardName(event.target.value)}
              />
              <button
                className="w-full rounded-2xl bg-stone-900 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handleCreateBoard}
                disabled={isCreatingBoard}
              >
                {isCreatingBoard ? "Creating..." : "Create board"}
              </button>
            </div>

            <div className="soft-card space-y-3 rounded-3xl p-3.5 sm:p-4">
              <div>
                <p className="text-sm font-medium text-stone-800">Share board</p>
                <p className="mt-1 text-xs leading-5 text-stone-500">
                  Invite an existing user by email and they will see this board.
                </p>
              </div>
              <input
                className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                placeholder="teammate@example.com"
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
              />
              <button
                className="w-full rounded-2xl border border-stone-200 bg-white py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handleInviteMember}
                disabled={!selectedBoardId || isInvitingMember}
              >
                {isInvitingMember ? "Inviting..." : "Invite member"}
              </button>

              <div className="space-y-2 pt-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-stone-200 bg-white/80 px-3 py-2"
                  >
                    <p className="text-sm text-stone-800">{member.email}</p>
                    <p className="mt-1 text-xs capitalize text-stone-500">
                      {member.role}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <DragOverlay>
        {activeTask ? <TaskCard id={activeTask.id} task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
