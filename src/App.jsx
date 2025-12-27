import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useTodos } from "./hooks/useTodos";

const THEME_KEY = "todo_minimalista_theme_v1";

const PRIORITIES = [
  { value: "high", label: "Alta", dot: "dot-high" },
  { value: "med", label: "Media", dot: "dot-med" },
  { value: "low", label: "Baja", dot: "dot-low" },
];

export default function App() {
  const {
    todos,
    tags,
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
  } = useTodos();

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useLocalStorage(THEME_KEY, () => {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });

  const dragIdRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function onDragStart(id) {
    dragIdRef.current = id;
  }

  function onDrop(overId) {
    const dragId = dragIdRef.current;
    dragIdRef.current = null;
    if (!dragId || dragId === overId) return;
    reorderTodos(dragId, overId);
  }

  function exportJSON() {
    const payload = exportData();
    const data = JSON.stringify(payload, null, 2);
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
        const payload = Array.isArray(parsed) ? { todos: parsed } : parsed;
        replaceData(payload);
      } catch {
        // ignore invalid payload
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
              {stats.total} total | {stats.active} pendientes | {stats.completed} completadas
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

            <button
              className="btn icon-btn theme-toggle"
              onClick={toggleTheme}
              title="Cambiar tema"
              aria-label="Cambiar tema"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
          </div>
        </header>

        <section className="card">
          <TodoComposer onAdd={addTodo} tags={tags} />

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
              placeholder="Buscar..."
              aria-label="Buscar tareas"
            />
          </div>

          <TagManager tags={tags} onCreate={createTag} onUpdate={updateTag} onDelete={deleteTag} />

          <ul className="list" role="list">
            {visibleTodos.length === 0 ? (
              <li className="empty">
                <span>No hay tareas aqui.</span>
              </li>
            ) : (
              visibleTodos.map((t) => (
                <TodoItem
                  key={t.id}
                  todo={t}
                  priorities={PRIORITIES}
                  tags={tags}
                  onToggle={() => toggleTodo(t.id)}
                  onRemove={() => removeTodo(t.id)}
                  onEdit={(text) => editTodo(t.id, text)}
                  onPriority={(p) => setPriority(t.id, p)}
                  onTagsChange={(ids) => setTagsForTodo(t.id, ids)}
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
          <span>Guardado automatico en localStorage.</span>
        </footer>
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      className={`chip ${active ? "chip-active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function TodoComposer({ onAdd, tags }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("med");
  const [selectedTags, setSelectedTags] = useState([]);

  function submit(e) {
    e.preventDefault();
    onAdd(text, priority, selectedTags);
    setText("");
    setPriority("med");
    setSelectedTags([]);
  }

  return (
    <form className="composer" onSubmit={submit}>
      <input
        className="input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nueva tarea..."
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

      <div className="tag-picker-row" aria-label="Tags para la nueva tarea">
        <TagPicker tags={tags} value={selectedTags} onChange={setSelectedTags} />
      </div>
    </form>
  );
}

function TodoItem({
  todo,
  priorities,
  tags,
  onToggle,
  onRemove,
  onEdit,
  onPriority,
  onTagsChange,
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
  const assignedTags = tags.filter((tag) => todo.tags?.includes(tag.id));

  return (
    <li
      className={`item ${todo.completed ? "item-done" : ""}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <button
        className={`check ${todo.completed ? "check-on" : ""}`}
        onClick={onToggle}
        aria-pressed={todo.completed}
        aria-label={todo.completed ? "Marcar como pendiente" : "Marcar como completada"}
      >
        {todo.completed ? "OK" : ""}
      </button>

      <span className={`dot ${pri.dot}`} title={`Prioridad: ${pri.label}`} />

      <div
        className="content"
        tabIndex={0}
        role="button"
        aria-label="Editar tarea"
        onDoubleClick={() => setEditing(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setEditing(true);
          }
          if (e.key === "Escape" && editing) {
            setDraft(todo.text);
            setEditing(false);
          }
        }}
      >
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

        <div className="tags-inline">
          {assignedTags.length ? (
            assignedTags.map((tag) => <TagBadge key={tag.id} tag={tag} />)
          ) : (
            <span className="tag-placeholder">Sin tags</span>
          )}
        </div>

        <TagPicker tags={tags} value={todo.tags || []} onChange={onTagsChange} dense />
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

      <button className="icon danger" onClick={onRemove} aria-label="Eliminar tarea">
        X
      </button>
    </li>
  );
}

function TagPicker({ tags, value, onChange, dense = false }) {
  const selected = new Set(value || []);

  function toggle(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  }

  if (!tags.length) {
    return <span className="tag-placeholder">Crea un tag para empezar</span>;
  }

  return (
    <div className={`tag-picker ${dense ? "tag-picker-dense" : ""}`}>
      {tags.map((tag) => (
        <label key={tag.id} className={`tag-option ${selected.has(tag.id) ? "tag-option-on" : ""}`}>
          <input type="checkbox" checked={selected.has(tag.id)} onChange={() => toggle(tag.id)} />
          <span className="tag-dot" style={{ background: tag.color }} />
          <span className="tag-label">{tag.label}</span>
        </label>
      ))}
    </div>
  );
}

function TagBadge({ tag }) {
  return (
    <span className="tag-pill" style={{ "--tag-color": tag.color }}>
      {tag.label}
    </span>
  );
}

function TagManager({ tags, onCreate, onUpdate, onDelete }) {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#7c5cff");

  function submit(e) {
    e.preventDefault();
    onCreate(label, color);
    setLabel("");
  }

  return (
    <details className="tag-panel">
      <summary className="tag-summary">
        <div>
          <span className="tag-summary-title">Tags y categorias</span>
          <span className="tag-summary-sub">Organiza tareas con colores discretos</span>
        </div>
        <span className="tag-summary-count">{tags.length} activos</span>
      </summary>
      <div className="tag-manager">
        <form className="tag-form" onSubmit={submit}>
          <input
            className="input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nombre del tag"
            aria-label="Nombre del tag"
          />
          <input
            className="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Color del tag"
          />
          <button className="btn btn-primary" type="submit">
            Agregar tag
          </button>
        </form>

        <div className="tag-list">
          {tags.map((tag) => (
            <div key={tag.id} className="tag-row">
              <TagBadge tag={tag} />
              <input
                className="tag-name"
                value={tag.label}
                onChange={(e) => onUpdate(tag.id, { label: e.target.value })}
                aria-label={`Renombrar tag ${tag.label}`}
              />
              <input
                className="color"
                type="color"
                value={tag.color}
                onChange={(e) => onUpdate(tag.id, { color: e.target.value })}
                aria-label={`Color de ${tag.label}`}
              />
              <button className="icon danger" type="button" onClick={() => onDelete(tag.id)} aria-label="Eliminar tag">
                X
              </button>
            </div>
          ))}
          {tags.length === 0 && <p className="tag-placeholder">Aun no tienes tags creados.</p>}
        </div>
      </div>
    </details>
  );
}
