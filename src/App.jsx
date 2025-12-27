import React, { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "todo_minimalista_v1";
const THEME_KEY = "todo_minimalista_theme_v1";

function uid() {
  return crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
}

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadTheme() {
  if (typeof window === "undefined") return "dark";

  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;

  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

const PRIORITIES = [
  { value: "high", label: "Alta", dot: "dot-high" },
  { value: "med", label: "Media", dot: "dot-med" },
  { value: "low", label: "Baja", dot: "dot-low" },
];

export default function App() {
  const [todos, setTodos] = useState(() => loadTodos());
  const [theme, setTheme] = useState(() => {
    const initial = loadTheme();
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", initial);
    }
    return initial;
  });
  const [filter, setFilter] = useState("all"); // all | active | completed
  const [query, setQuery] = useState("");

  // DnD
  const dragIdRef = useRef(null);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;
    return { total, active, completed };
  }, [todos]);

  const visibleTodos = useMemo(() => {
    const q = query.trim().toLowerCase();
    return todos
      .filter((t) => {
        if (filter === "active") return !t.completed;
        if (filter === "completed") return t.completed;
        return true;
      })
      .filter((t) => {
        if (!q) return true;
        return t.text.toLowerCase().includes(q);
      });
  }, [todos, filter, query]);

  function addTodo(text, priority) {
    const clean = text.trim();
    if (!clean) return;

    const now = Date.now();
    const next = [
      {
        id: uid(),
        text: clean,
        completed: false,
        priority,
        createdAt: now,
        updatedAt: now,
      },
      ...todos,
    ];
    setTodos(next);
  }

  function toggleTodo(id) {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed, updatedAt: Date.now() } : t
      )
    );
  }

  function removeTodo(id) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function editTodo(id, nextText) {
    const clean = nextText.trim();
    if (!clean) return;
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, text: clean, updatedAt: Date.now() } : t
      )
    );
  }

  function setPriority(id, priority) {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, priority, updatedAt: Date.now() } : t
      )
    );
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((t) => !t.completed));
  }

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  // Drag & Drop: reordenar dentro de la lista visible, respetando el orden global
  function onDragStart(id) {
    dragIdRef.current = id;
  }

  function onDrop(overId) {
    const dragId = dragIdRef.current;
    dragIdRef.current = null;
    if (!dragId || dragId === overId) return;

    setTodos((prev) => {
      const a = prev.findIndex((t) => t.id === dragId);
      const b = prev.findIndex((t) => t.id === overId);
      if (a === -1 || b === -1) return prev;

      const copy = [...prev];
      const [moved] = copy.splice(a, 1);
      copy.splice(b, 0, moved);
      return copy;
    });
  }

  function exportJSON() {
    const data = JSON.stringify(todos, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "todos.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? "[]"));
        if (!Array.isArray(parsed)) return;

        // sanitizar estructura mínima
        const cleaned = parsed
          .filter((x) => x && typeof x === "object")
          .map((x) => ({
            id: typeof x.id === "string" ? x.id : uid(),
            text: typeof x.text === "string" ? x.text : "",
            completed: Boolean(x.completed),
            priority:
              x.priority === "high" || x.priority === "med" || x.priority === "low"
                ? x.priority
                : "med",
            createdAt: typeof x.createdAt === "number" ? x.createdAt : Date.now(),
            updatedAt: typeof x.updatedAt === "number" ? x.updatedAt : Date.now(),
          }))
          .filter((x) => x.text.trim().length > 0);

        setTodos(cleaned);
      } catch {
        // ignorar si no es JSON válido
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="page">
      <div className="shell">
        <header className="top">
          <div>
            <h1>ToDo Minimalista</h1>
            <p className="sub">
              {stats.total} total · {stats.active} pendientes · {stats.completed} completadas
            </p>
          </div>

          <div className="actions">
            <button className="btn" onClick={exportJSON} title="Exportar a JSON">
              Exportar
            </button>

            <label className="btn btn-ghost" title="Importar desde JSON">
              Importar
              <input
                className="file"
                type="file"
                accept="application/json"
                onChange={(e) => importJSON(e.target.files?.[0])}
              />
            </label>

            <button className="btn btn-danger" onClick={clearCompleted} disabled={stats.completed === 0}>
              Limpiar completadas
            </button>

            <button className="btn btn-ghost theme-toggle" onClick={toggleTheme} title="Cambiar tema">
              {theme === "dark" ? "Modo claro" : "Modo oscuro"}
            </button>
          </div>
        </header>

        <section className="card">
          <TodoComposer onAdd={addTodo} />

          <div className="toolbar">
            <div className="filters">
              <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
                Todas
              </FilterButton>
              <FilterButton active={filter === "active"} onClick={() => setFilter("active")}>
                Pendientes
              </FilterButton>
              <FilterButton active={filter === "completed"} onClick={() => setFilter("completed")}>
                Completadas
              </FilterButton>
            </div>

            <input
              className="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              aria-label="Buscar tareas"
            />
          </div>

          <ul className="list" role="list">
            {visibleTodos.length === 0 ? (
              <li className="empty">
                <span>No hay tareas aquí.</span>
              </li>
            ) : (
              visibleTodos.map((t) => (
                <TodoItem
                  key={t.id}
                  todo={t}
                  priorities={PRIORITIES}
                  onToggle={() => toggleTodo(t.id)}
                  onRemove={() => removeTodo(t.id)}
                  onEdit={(text) => editTodo(t.id, text)}
                  onPriority={(p) => setPriority(t.id, p)}
                  onDragStart={() => onDragStart(t.id)}
                  onDrop={() => onDrop(t.id)}
                />
              ))
            )}
          </ul>

          <footer className="hint">
            Tip: arrastra una tarea para reordenar. Doble click para editar.
          </footer>
        </section>

        <footer className="bottom">
          <span>Guardado automático en localStorage.</span>
        </footer>
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button className={`chip ${active ? "chip-active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

function TodoComposer({ onAdd }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("med");

  function submit(e) {
    e.preventDefault();
    onAdd(text, priority);
    setText("");
    setPriority("med");
  }

  return (
    <form className="composer" onSubmit={submit}>
      <input
        className="input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nueva tarea…"
        aria-label="Nueva tarea"
      />

      <select
        className="select"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        aria-label="Prioridad"
      >
        <option value="high">Alta</option>
        <option value="med">Media</option>
        <option value="low">Baja</option>
      </select>

      <button className="btn btn-primary" type="submit">
        Agregar
      </button>
    </form>
  );
}

function TodoItem({
  todo,
  priorities,
  onToggle,
  onRemove,
  onEdit,
  onPriority,
  onDragStart,
  onDrop,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);

  useEffect(() => {
    setDraft(todo.text);
  }, [todo.text]);

  function commit() {
    const clean = draft.trim();
    if (clean && clean !== todo.text) onEdit(clean);
    setEditing(false);
  }

  const pri = priorities.find((p) => p.value === todo.priority) ?? priorities[1];

  return (
    <li
      className={`item ${todo.completed ? "item-done" : ""}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <button className={`check ${todo.completed ? "check-on" : ""}`} onClick={onToggle} aria-label="Completar">
        {todo.completed ? "✓" : ""}
      </button>

      <span className={`dot ${pri.dot}`} title={`Prioridad: ${pri.label}`} />

      <div className="content" onDoubleClick={() => setEditing(true)}>
        {editing ? (
          <input
            className="edit"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(todo.text);
                setEditing(false);
              }
            }}
            autoFocus
            aria-label="Editar tarea"
          />
        ) : (
          <span className="text">{todo.text}</span>
        )}
      </div>

      <select
        className="select mini"
        value={todo.priority}
        onChange={(e) => onPriority(e.target.value)}
        aria-label="Cambiar prioridad"
      >
        <option value="high">Alta</option>
        <option value="med">Media</option>
        <option value="low">Baja</option>
      </select>

      <button className="icon danger" onClick={onRemove} aria-label="Eliminar">
        ✕
      </button>
    </li>
  );
}
