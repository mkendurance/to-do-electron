import { useState, useRef } from "react";

/* ─── Data ─────────────────────────────────────────────── */
const LISTS = [
  { id: "myday",     label: "My Day",    icon: "☀️",  accent: "#FF9500" },
  { id: "important", label: "Important", icon: "⭐",  accent: "#FF3B30" },
  { id: "planned",   label: "Planned",   icon: "📅",  accent: "#007AFF" },
  { id: "personal",  label: "Personal",  icon: "🏠",  accent: "#34C759" },
  { id: "work",      label: "Work",      icon: "💼",  accent: "#5856D6" },
  { id: "shopping",  label: "Shopping",  icon: "🛍️",  accent: "#FF2D55" },
];

const INITIAL_TODOS = [
  { id: 1, text: "Review quarterly design report",  list: "work",     done: false, starred: true,  date: fmt(0),  note: "Focus on Q3 metrics" },
  { id: 2, text: "Buy groceries",                   list: "shopping", done: false, starred: false, date: fmt(0),  note: "Milk, eggs, bread, avocados" },
  { id: 3, text: "Morning run – 5 km",              list: "myday",    done: true,  starred: false, date: fmt(0),  note: "" },
  { id: 4, text: "Team standup call",               list: "work",     done: false, starred: true,  date: fmt(0),  note: "Zoom link in calendar" },
  { id: 5, text: "Read — Atomic Habits ch. 7",      list: "personal", done: false, starred: false, date: fmt(1),  note: "" },
  { id: 6, text: "Pay electricity bill",            list: "personal", done: false, starred: false, date: fmt(2),  note: "" },
  { id: 7, text: "Send project proposal",           list: "work",     done: false, starred: true,  date: fmt(1),  note: "Attach revised budget sheet" },
];

function fmt(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS = ["S","M","T","W","T","F","S"];

function todayStr() { return fmt(0); }
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOf(y, m)  { return new Date(y, m, 1).getDay(); }
function calKey(y, m, d)   { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }

const isMac = typeof window !== "undefined" && window.electronAPI?.platform === "darwin";

/* ─── App ───────────────────────────────────────────────── */
export default function App() {
  const [todos, setTodos]             = useState(INITIAL_TODOS);
  const [activeList, setActiveList]   = useState("myday");
  const [newText, setNewText]         = useState("");
  const [selectedId, setSelectedId]   = useState(null);
  const [searchQ, setSearchQ]         = useState("");
  const [calMonth, setCalMonth]       = useState(new Date().getMonth());
  const [calYear, setCalYear]         = useState(new Date().getFullYear());
  const [calSelected, setCalSelected] = useState(todayStr());
  const inputRef = useRef(null);

  const listInfo = LISTS.find(l => l.id === activeList) || LISTS[0];

  const filtered = todos.filter(t => {
    if (searchQ) return t.text.toLowerCase().includes(searchQ.toLowerCase());
    if (activeList === "myday")     return t.date === todayStr() || t.list === "myday";
    if (activeList === "important") return t.starred;
    if (activeList === "planned")   return !!t.date;
    return t.list === activeList;
  });

  const activeTodos = filtered.filter(t => !t.done);
  const doneTodos   = filtered.filter(t => t.done);
  const selected    = todos.find(t => t.id === selectedId) || null;

  function addTodo(e) {
    e.preventDefault();
    if (!newText.trim()) return;
    const t = {
      id: Date.now(), text: newText.trim(),
      list: ["myday","important","planned"].includes(activeList) ? "personal" : activeList,
      done: false, starred: activeList === "important",
      date: ["myday","planned"].includes(activeList) ? todayStr() : "",
      note: "",
    };
    setTodos(p => [...p, t]);
    setNewText("");
    inputRef.current?.focus();
  }

  function mutate(id, patch) {
    setTodos(p => p.map(t => t.id === id ? { ...t, ...patch } : t));
  }

  function removeTodo(id) {
    setTodos(p => p.filter(t => t.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  const dotDates = {};
  todos.forEach(t => { if (t.date) dotDates[t.date] = true; });

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      background: "#F2F2F7", color: "#1C1C1E",
      userSelect: "none",
    }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 248, flexShrink: 0,
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderRight: "1px solid rgba(0,0,0,0.08)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div className="drag-region" style={{ height: isMac ? 52 : 14, flexShrink: 0 }} />

        <div style={{ padding: "0 14px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, #007AFF 0%, #5856D6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, boxShadow: "0 2px 8px rgba(0,122,255,0.35)",
            }}>✓</div>
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.4px" }}>Reminders</span>
          </div>

          <div className="no-drag" style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "rgba(142,142,147,0.12)",
            borderRadius: 10, padding: "8px 11px", marginBottom: 6,
          }}>
            <span style={{ fontSize: 13, opacity: 0.45 }}>🔍</span>
            <input
              data-testid="search-input"
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, color: "#1C1C1E", userSelect: "text" }}
              placeholder="Search tasks…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
            {searchQ && (
              <span onClick={() => setSearchQ("")} style={{ cursor: "pointer", fontSize: 12, color: "#8E8E93" }}>✕</span>
            )}
          </div>
        </div>

        {/* Lists */}
        <div style={{ flex: 1, overflowY: "auto", padding: "2px 8px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, color: "#8E8E93", textTransform: "uppercase", padding: "8px 8px 4px" }}>My Lists</div>
          {LISTS.map(l => {
            const cnt = todos.filter(t => {
              if (l.id === "myday")     return (t.date === todayStr() || t.list === "myday") && !t.done;
              if (l.id === "important") return t.starred && !t.done;
              if (l.id === "planned")   return !!t.date && !t.done;
              return t.list === l.id && !t.done;
            }).length;
            const isActive = activeList === l.id && !searchQ;
            return (
              <div key={l.id}
                data-testid={`list-${l.id}`}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", borderRadius: 10, cursor: "pointer", marginBottom: 1,
                  background: isActive ? `${l.accent}15` : "transparent",
                  transition: "background 0.12s",
                }}
                onClick={() => { setActiveList(l.id); setSearchQ(""); setSelectedId(null); }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${l.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{l.icon}</div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: isActive ? 600 : 400 }}>{l.label}</span>
                {cnt > 0 && <span style={{ fontSize: 12, color: "#8E8E93", fontWeight: 500 }}>{cnt}</span>}
              </div>
            );
          })}
        </div>

        {/* Mini Calendar */}
        <div style={{ margin: "8px", borderRadius: 14, background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.07)", padding: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button data-testid="cal-prev" onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "#007AFF", fontSize: 18, padding: "0 4px" }}>‹</button>
            <span data-testid="cal-month-label" style={{ fontSize: 13, fontWeight: 700 }}>{MONTHS[calMonth].slice(0,3)} {calYear}</span>
            <button data-testid="cal-next" onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "#007AFF", fontSize: 18, padding: "0 4px" }}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1 }}>
            {DAY_LABELS.map((d, i) => (
              <div key={i} style={{ fontSize: 9.5, fontWeight: 600, color: "#8E8E93", textAlign: "center", padding: "2px 0" }}>{d}</div>
            ))}
            {Array(firstDayOf(calYear, calMonth)).fill(null).map((_, i) => <div key={"_"+i} />)}
            {Array(daysInMonth(calYear, calMonth)).fill(null).map((_, i) => {
              const day = i + 1;
              const key = calKey(calYear, calMonth, day);
              const isToday    = key === todayStr();
              const isSelected = key === calSelected;
              const hasTask    = !!dotDates[key];
              return (
                <div key={day}
                  style={{
                    fontSize: 11, fontWeight: isToday ? 700 : 400,
                    textAlign: "center", padding: "4px 2px", borderRadius: 6,
                    cursor: "pointer", position: "relative",
                    background: isSelected ? "#007AFF" : isToday ? "#007AFF1A" : "transparent",
                    color: isSelected ? "#fff" : isToday ? "#007AFF" : "#1C1C1E",
                    transition: "background 0.1s",
                  }}
                  onClick={() => { setCalSelected(key); setActiveList("planned"); setSearchQ(""); }}
                >
                  {day}
                  {hasTask && !isSelected && (
                    <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#007AFF", position: "absolute", bottom: 1, left: "50%", transform: "translateX(-50%)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{
          padding: isMac ? "38px 28px 14px" : "20px 28px 14px",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          background: "rgba(242,242,247,0.9)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: `${listInfo.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{listInfo.icon}</div>
            <div>
              <h1 data-testid="main-title" style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.6px", color: listInfo.accent }}>
                {searchQ ? "Search" : listInfo.label}
              </h1>
              <p data-testid="main-subtitle" style={{ margin: "2px 0 0", fontSize: 12, color: "#8E8E93" }}>
                {searchQ
                  ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${searchQ}"`
                  : `${activeTodos.length} remaining · ${doneTodos.length} completed`}
              </p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 20px", userSelect: "text" }}>
          {activeTodos.length === 0 && doneTodos.length === 0 && (
            <div data-testid="empty-state" style={{ textAlign: "center", padding: "60px 20px", opacity: 0.35 }}>
              <div style={{ fontSize: 46 }}>🎉</div>
              <p style={{ fontSize: 15, marginTop: 8, fontWeight: 500 }}>All tasks complete!</p>
            </div>
          )}

          {activeTodos.map((t, i) => (
            <TodoCard key={t.id} todo={t} accent={listInfo.accent}
              selected={t.id === selectedId}
              onToggle={() => mutate(t.id, { done: !t.done })}
              onStar={() => mutate(t.id, { starred: !t.starred })}
              onDelete={() => removeTodo(t.id)}
              onClick={() => setSelectedId(t.id === selectedId ? null : t.id)}
              index={i}
            />
          ))}

          {doneTodos.length > 0 && (
            <>
              <div data-testid="completed-section" style={{
                fontSize: 11, fontWeight: 600, letterSpacing: 0.4,
                color: "#8E8E93", textTransform: "uppercase", padding: "10px 4px 6px",
              }}>Completed · {doneTodos.length}</div>
              {doneTodos.map((t, i) => (
                <TodoCard key={t.id} todo={t} accent={listInfo.accent}
                  selected={t.id === selectedId}
                  onToggle={() => mutate(t.id, { done: !t.done })}
                  onStar={() => mutate(t.id, { starred: !t.starred })}
                  onDelete={() => removeTodo(t.id)}
                  onClick={() => setSelectedId(t.id === selectedId ? null : t.id)}
                  index={i}
                />
              ))}
            </>
          )}
        </div>

        {/* Add bar */}
        <form data-testid="add-form" style={{
          padding: "10px 20px 18px",
          borderTop: "1px solid rgba(0,0,0,0.07)",
          background: "rgba(242,242,247,0.95)",
        }} onSubmit={addTodo}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#fff", borderRadius: 13, padding: "11px 14px",
            border: "1px solid rgba(0,0,0,0.09)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
              border: `2px solid ${listInfo.accent}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: listInfo.accent, fontSize: 16,
            }}>+</div>
            <input
              ref={inputRef}
              data-testid="add-input"
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15, color: "#1C1C1E", userSelect: "text" }}
              placeholder="Add a task…"
              value={newText}
              onChange={e => setNewText(e.target.value)}
            />
            {newText.trim() && (
              <button data-testid="add-submit" type="submit" style={{
                background: listInfo.accent, border: "none", color: "#fff",
                borderRadius: 8, padding: "5px 13px", cursor: "pointer",
                fontSize: 13, fontWeight: 600,
              }}>Add</button>
            )}
          </div>
        </form>
      </main>

      {/* ── Detail Panel ── */}
      {selected && (
        <DetailPanel
          todo={selected}
          accent={listInfo.accent}
          isMac={isMac}
          onClose={() => setSelectedId(null)}
          onMutate={(patch) => mutate(selected.id, patch)}
          onDelete={() => removeTodo(selected.id)}
        />
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─── TodoCard ───────────────────────────────────────────── */
function TodoCard({ todo, accent, selected, onToggle, onStar, onDelete, onClick, index }) {
  return (
    <div
      data-testid="todo-card"
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "12px 14px", borderRadius: 13, marginBottom: 5,
        background: selected ? "rgba(0,122,255,0.06)" : "#fff",
        border: `1px solid ${selected ? "rgba(0,122,255,0.18)" : "rgba(0,0,0,0.06)"}`,
        cursor: "pointer", transition: "all 0.14s",
        boxShadow: selected ? "0 2px 12px rgba(0,122,255,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
        animation: `fadeSlideIn 0.18s ease both`,
        animationDelay: `${index * 0.03}s`,
      }}
      onClick={onClick}
    >
      <button
        data-testid="todo-check"
        style={{
          width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
          border: todo.done ? "none" : `2px solid ${accent}`,
          background: todo.done ? accent : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.18s", outline: "none",
        }}
        onClick={e => { e.stopPropagation(); onToggle(); }}
      >
        {todo.done && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 400, lineHeight: "1.45",
          textDecoration: todo.done ? "line-through" : "none",
          color: todo.done ? "#8E8E93" : "#1C1C1E",
        }}>{todo.text}</div>
        <div style={{ fontSize: 11, color: "#8E8E93", marginTop: 3 }}>
          {todo.note && <span>📝 {todo.note.slice(0,36)}{todo.note.length > 36 ? "…" : ""}</span>}
          {todo.note && todo.date && <span style={{ margin: "0 5px", opacity: 0.4 }}>·</span>}
          {todo.date && (
            <span style={{ color: todo.date < todayStr() && !todo.done ? "#FF3B30" : "#007AFF" }}>
              📅 {todo.date}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, flexShrink: 0, marginTop: 1 }}>
        <button data-testid="todo-star"
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: "2px", opacity: todo.starred ? 1 : 0.2, color: "#FF9500" }}
          onClick={e => { e.stopPropagation(); onStar(); }}>⭐</button>
        <button data-testid="todo-delete"
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: "2px", opacity: 0.25, color: "#FF3B30", transition: "opacity 0.14s" }}
          onClick={e => { e.stopPropagation(); onDelete(); }}>✕</button>
      </div>
    </div>
  );
}

/* ─── DetailPanel ────────────────────────────────────────── */
function DetailPanel({ todo, accent, isMac, onClose, onMutate, onDelete }) {
  return (
    <aside data-testid="detail-panel" style={{
      width: 296, flexShrink: 0,
      borderLeft: "1px solid rgba(0,0,0,0.08)",
      background: "rgba(255,255,255,0.8)",
      backdropFilter: "blur(24px) saturate(180%)",
      WebkitBackdropFilter: "blur(24px) saturate(180%)",
      display: "flex", flexDirection: "column",
      padding: `${isMac ? 52 : 18}px 16px 18px`,
      gap: 12, overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span data-testid="detail-title" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "#8E8E93", textTransform: "uppercase" }}>Task Details</span>
        <button data-testid="detail-done-btn" style={{
          fontSize: 12, fontWeight: 600, color: accent,
          background: `${accent}15`, border: "none", borderRadius: 7,
          padding: "5px 12px", cursor: "pointer",
        }} onClick={onClose}>Done</button>
      </div>

      {/* Task actions */}
      <div style={{ background: "#F9F9FB", borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)", padding: 14 }}>
        <div style={{
          fontSize: 16, fontWeight: 500, lineHeight: 1.4, marginBottom: 10,
          textDecoration: todo.done ? "line-through" : "none",
          color: todo.done ? "#8E8E93" : "#1C1C1E",
        }}>{todo.text}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button data-testid="detail-mark-done"
            style={{
              flex: 1, border: "none", borderRadius: 9, padding: "8px 6px",
              cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: todo.done ? "#34C75918" : "#EDEDF0",
              color: todo.done ? "#34C759" : "#8E8E93",
            }}
            onClick={() => onMutate({ done: !todo.done })}
          >{todo.done ? "✓ Done" : "Mark Done"}</button>
          <button data-testid="detail-star"
            style={{
              flex: 1, border: "none", borderRadius: 9, padding: "8px 6px",
              cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: todo.starred ? "#FF950018" : "#EDEDF0",
              color: todo.starred ? "#FF9500" : "#8E8E93",
            }}
            onClick={() => onMutate({ starred: !todo.starred })}
          >⭐ {todo.starred ? "Starred" : "Star"}</button>
        </div>
      </div>

      {/* Due date */}
      <div style={{ background: "#F9F9FB", borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)", padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 7 }}>📅 Due Date</div>
        <input
          type="date"
          data-testid="detail-date-input"
          style={{
            width: "100%", boxSizing: "border-box",
            background: "#F9F9FB", border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 9, padding: "9px 11px", fontSize: 13, color: "#1C1C1E", outline: "none",
          }}
          value={todo.date || ""}
          onChange={e => onMutate({ date: e.target.value })}
        />
      </div>

      {/* Notes */}
      <div style={{
        background: "#F9F9FB", borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)",
        padding: 14, flex: 1, display: "flex", flexDirection: "column",
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 7 }}>📝 Notes</div>
        <textarea
          data-testid="detail-notes"
          style={{
            width: "100%", boxSizing: "border-box", resize: "none",
            background: "transparent", border: "none", outline: "none",
            fontSize: 14, color: "#1C1C1E", lineHeight: 1.6, minHeight: 90, userSelect: "text",
          }}
          placeholder="Add a note…"
          value={todo.note || ""}
          onChange={e => onMutate({ note: e.target.value })}
        />
      </div>

      {/* Overdue warning */}
      {todo.date && todo.date < todayStr() && !todo.done && (
        <div data-testid="overdue-warning" style={{
          background: "#FFF0F0", borderRadius: 9, padding: "8px 12px",
          fontSize: 12, color: "#FF3B30", fontWeight: 500,
          border: "1px solid rgba(255,59,48,0.15)",
        }}>⚠️ This task is overdue</div>
      )}

      <button data-testid="detail-delete" style={{
        background: "#FFF0F0", border: "1px solid rgba(255,59,48,0.18)",
        color: "#FF3B30", borderRadius: 11, padding: "10px",
        cursor: "pointer", fontSize: 14, fontWeight: 600,
      }} onClick={onDelete}>🗑 Delete Task</button>
    </aside>
  );
}
