import { useEffect, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";

const STORAGE_KEY = "todo_minimalista_state_v2";
const LEGACY_KEY = "todo_minimalista_v1";
const VALID_PRIORITIES = ["high", "med", "low"];

const DEFAULT_TAGS = [
  { id: "tag-work", label: "Trabajo", color: "#7c5cff" },
  { id: "tag-home", label: "Personal", color: "#5dd39e" },
  { id: "tag-ideas", label: "Ideas", color: "#f9c74f" },
];

function uid() {
  return crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
}

function randomColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 62;
  const lightness = 64;
  return `hsl(${hue}deg ${saturation}% ${lightness}%)`;
}

function ensurePriority(priority) {
  return VALID_PRIORITIES.includes(priority) ? priority : "med";
}

function normalizeTags(rawTags = DEFAULT_TAGS) {
  const seen = new Set();
  return (Array.isArray(rawTags) ? rawTags : DEFAULT_TAGS)
    .filter((t) => t && typeof t === "object")
    .map((t, idx) => {
      const id = typeof t.id === "string" && t.id.trim() ? t.id.trim() : `tag-${idx}-${uid()}`;
      const label = typeof t.label === "string" && t.label.trim() ? t.label.trim() : `Tag ${idx + 1}`;
      const color = typeof t.color === "string" && t.color.trim() ? t.color.trim() : randomColor();
      return { id, label, color };
    })
    .filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
}

function normalizeTodos(rawTodos = [], tags = DEFAULT_TAGS) {
  const tagIds = new Set(tags.map((t) => t.id));
  return (Array.isArray(rawTodos) ? rawTodos : [])
    .filter((t) => t && typeof t === "object")
    .map((t) => {
      const id = typeof t.id === "string" ? t.id : uid();
      const text = typeof t.text === "string" ? t.text.trim() : "";
      const completed = Boolean(t.completed);
      const priority = ensurePriority(t.priority);
      const createdAt = typeof t.createdAt === "number" ? t.createdAt : Date.now();
      const updatedAt = typeof t.updatedAt === "number" ? t.updatedAt : createdAt;
      const tagsSafe = Array.isArray(t.tags) ? t.tags.filter((tagId) => tagIds.has(tagId)) : [];
      return { id, text, completed, priority, tags: tagsSafe, createdAt, updatedAt };
    })
    .filter((t) => t.text.length > 0);
}

function normalizeState(raw) {
  if (!raw) {
    const tags = normalizeTags();
    return { todos: [], tags };
  }
  if (Array.isArray(raw)) {
    const tags = normalizeTags();
    const todos = normalizeTodos(raw, tags);
    return { todos, tags };
  }
  const tags = normalizeTags(raw.tags);
  const todos = normalizeTodos(raw.todos, tags);
  return { todos, tags };
}

function statesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useTodos() {
  const [state, setState] = useLocalStorage(STORAGE_KEY, () => {
    if (typeof window !== "undefined") {
      try {
        const legacy = window.localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const parsedLegacy = JSON.parse(legacy);
          return normalizeState(parsedLegacy);
        }
      } catch {
        // ignore legacy errors
      }
    }
    return normalizeState();
  });
  const normalized = useMemo(() => normalizeState(state), [state]);

  useEffect(() => {
    if (!statesEqual(normalized, state)) setState(normalized);
  }, [normalized, state, setState]);

  const stats = useMemo(() => {
    const total = normalized.todos.length;
    const completed = normalized.todos.filter((t) => t.completed).length;
    const active = total - completed;
    return { total, completed, active };
  }, [normalized.todos]);

  function commit(updater) {
    setState((prev) => {
      const current = normalizeState(prev);
      const next = updater(current);
      return normalizeState(next);
    });
  }

  function addTodo(text, priority, tagIds = []) {
    const clean = text.trim();
    if (!clean) return;
    commit((prev) => {
      const now = Date.now();
      const allowed = new Set(prev.tags.map((t) => t.id));
      const safeTags = tagIds.filter((id) => allowed.has(id));
      const todo = {
        id: uid(),
        text: clean,
        completed: false,
        priority: ensurePriority(priority),
        tags: safeTags,
        createdAt: now,
        updatedAt: now,
      };
      return { ...prev, todos: [todo, ...prev.todos] };
    });
  }

  function toggleTodo(id) {
    commit((prev) => ({
      ...prev,
      todos: prev.todos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed, updatedAt: Date.now() } : t
      ),
    }));
  }

  function removeTodo(id) {
    commit((prev) => ({ ...prev, todos: prev.todos.filter((t) => t.id !== id) }));
  }

  function editTodo(id, nextText) {
    const clean = nextText.trim();
    if (!clean) return;
    commit((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => (t.id === id ? { ...t, text: clean, updatedAt: Date.now() } : t)),
    }));
  }

  function setPriority(id, priority) {
    commit((prev) => ({
      ...prev,
      todos: prev.todos.map((t) =>
        t.id === id ? { ...t, priority: ensurePriority(priority), updatedAt: Date.now() } : t
      ),
    }));
  }

  function setTagsForTodo(id, tagIds) {
    commit((prev) => {
      const allowed = new Set(prev.tags.map((t) => t.id));
      const cleaned = (Array.isArray(tagIds) ? tagIds : []).filter((tagId) => allowed.has(tagId));
      return {
        ...prev,
        todos: prev.todos.map((t) =>
          t.id === id ? { ...t, tags: cleaned, updatedAt: Date.now() } : t
        ),
      };
    });
  }

  function clearCompleted() {
    commit((prev) => ({ ...prev, todos: prev.todos.filter((t) => !t.completed) }));
  }

  function reorderTodos(dragId, overId) {
    commit((prev) => {
      const a = prev.todos.findIndex((t) => t.id === dragId);
      const b = prev.todos.findIndex((t) => t.id === overId);
      if (a === -1 || b === -1) return prev;
      const copy = [...prev.todos];
      const [moved] = copy.splice(a, 1);
      copy.splice(b, 0, moved);
      return { ...prev, todos: copy };
    });
  }

  function replaceData(payload) {
    commit(() => payload);
  }

  function exportData() {
    return normalizeState(state);
  }

  function createTag(label, color) {
    const name = label.trim();
    if (!name) return;
    const shade = color && color.trim() ? color.trim() : randomColor();
    commit((prev) => {
      const exists = prev.tags.some((t) => t.label.toLowerCase() === name.toLowerCase());
      if (exists) return prev;
      const tag = { id: uid(), label: name, color: shade };
      return { ...prev, tags: [...prev.tags, tag] };
    });
  }

  function updateTag(id, patch) {
    commit((prev) => {
      const tags = prev.tags.map((t) => {
        if (t.id !== id) return t;
        const label = typeof patch.label === "string" && patch.label.trim() ? patch.label.trim() : t.label;
        const color = typeof patch.color === "string" && patch.color.trim() ? patch.color.trim() : t.color;
        return { ...t, label, color };
      });
      return { ...prev, tags };
    });
  }

  function deleteTag(id) {
    commit((prev) => {
      const tags = prev.tags.filter((t) => t.id !== id);
      const allowed = new Set(tags.map((t) => t.id));
      const todos = prev.todos.map((t) => ({
        ...t,
        tags: (t.tags || []).filter((tagId) => allowed.has(tagId)),
      }));
      return { ...prev, tags, todos };
    });
  }

  return {
    todos: normalized.todos,
    tags: normalized.tags,
    stats,
    addTodo,
    toggleTodo,
    removeTodo,
    editTodo,
    setPriority,
    setTagsForTodo,
    clearCompleted,
    reorderTodos,
    replaceData,
    exportData,
    createTag,
    updateTag,
    deleteTag,
  };
}
