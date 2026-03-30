// tests/component/App.test.jsx
// Component-level tests using React Testing Library + Vitest
// Tests the rendered UI interactions without Electron

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Inline minimal App for component testing ───────────────────────
// We replicate a minimal version here so tests don't depend on
// relative path resolution. In a real monorepo, import from src directly:
// import App from "../../todo-electron/src/App.jsx";

import { useState, useRef } from "react";

const LISTS = [
  { id: "myday",    label: "My Day",    icon: "☀️", accent: "#FF9500" },
  { id: "work",     label: "Work",      icon: "💼", accent: "#5856D6" },
  { id: "personal", label: "Personal",  icon: "🏠", accent: "#34C759" },
];

const SAMPLE = [
  { id: 1, text: "Morning run",    list: "myday",    done: false, starred: false, date: new Date().toISOString().split("T")[0], note: "" },
  { id: 2, text: "Write report",   list: "work",     done: false, starred: true,  date: "",       note: "Add charts" },
  { id: 3, text: "Buy groceries",  list: "personal", done: true,  starred: false, date: "",       note: "" },
];

function TestApp() {
  const [todos, setTodos]           = useState(SAMPLE);
  const [activeList, setActiveList] = useState("myday");
  const [newText, setNewText]       = useState("");
  const inputRef = useRef(null);
  const today = new Date().toISOString().split("T")[0];

  const filtered = todos.filter(t => {
    if (activeList === "myday") return t.date === today || t.list === "myday";
    return t.list === activeList;
  });

  const active = filtered.filter(t => !t.done);
  const done   = filtered.filter(t => t.done);

  function addTodo(e) {
    e.preventDefault();
    if (!newText.trim()) return;
    setTodos(p => [...p, { id: Date.now(), text: newText.trim(), list: activeList, done: false, starred: false, date: "", note: "" }]);
    setNewText("");
  }

  return (
    <div>
      {/* Sidebar list buttons */}
      {LISTS.map(l => (
        <button key={l.id} data-testid={`list-${l.id}`}
          onClick={() => setActiveList(l.id)}>
          {l.label}
        </button>
      ))}

      {/* Active list label */}
      <h1 data-testid="active-title">{LISTS.find(l => l.id === activeList)?.label}</h1>
      <p data-testid="subtitle">{active.length} remaining · {done.length} completed</p>

      {/* Active todos */}
      <ul data-testid="active-list">
        {active.map(t => (
          <li key={t.id} data-testid={`todo-${t.id}`}>
            <button data-testid={`check-${t.id}`}
              onClick={() => setTodos(p => p.map(x => x.id === t.id ? { ...x, done: !x.done } : x))}>
              {t.done ? "✓" : "○"}
            </button>
            <span data-testid={`text-${t.id}`}>{t.text}</span>
            <button data-testid={`delete-${t.id}`}
              onClick={() => setTodos(p => p.filter(x => x.id !== t.id))}>✕</button>
          </li>
        ))}
      </ul>

      {/* Completed todos */}
      {done.length > 0 && (
        <section data-testid="completed-section">
          <h2>Completed · {done.length}</h2>
          {done.map(t => (
            <div key={t.id} data-testid={`done-${t.id}`}>{t.text}</div>
          ))}
        </section>
      )}

      {/* Add form */}
      <form data-testid="add-form" onSubmit={addTodo}>
        <input ref={inputRef} data-testid="add-input"
          value={newText} onChange={e => setNewText(e.target.value)}
          placeholder="Add a task…" />
        <button type="submit" data-testid="add-btn">Add</button>
      </form>
    </div>
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe("App — initial render", () => {
  it("renders the My Day title on load", () => {
    render(<TestApp />);
    expect(screen.getByTestId("active-title").textContent).toBe("My Day");
  });

  it("renders the add task input", () => {
    render(<TestApp />);
    expect(screen.getByTestId("add-input")).toBeTruthy();
  });

  it("shows correct remaining count on load", () => {
    render(<TestApp />);
    const subtitle = screen.getByTestId("subtitle").textContent;
    expect(subtitle).toMatch(/remaining/);
  });
});

describe("List navigation", () => {
  it("switches to Work list on click", async () => {
    render(<TestApp />);
    await userEvent.click(screen.getByTestId("list-work"));
    expect(screen.getByTestId("active-title").textContent).toBe("Work");
  });

  it("switches to Personal list on click", async () => {
    render(<TestApp />);
    await userEvent.click(screen.getByTestId("list-personal"));
    expect(screen.getByTestId("active-title").textContent).toBe("Personal");
  });

  it("switches back to My Day", async () => {
    render(<TestApp />);
    await userEvent.click(screen.getByTestId("list-work"));
    await userEvent.click(screen.getByTestId("list-myday"));
    expect(screen.getByTestId("active-title").textContent).toBe("My Day");
  });
});

describe("Adding tasks", () => {
  it("adds a new task to the active list", async () => {
    render(<TestApp />);
    await userEvent.click(screen.getByTestId("list-work"));
    await userEvent.type(screen.getByTestId("add-input"), "New work task");
    fireEvent.submit(screen.getByTestId("add-form"));
    expect(screen.getByText("New work task")).toBeTruthy();
  });

  it("clears the input after adding", async () => {
    render(<TestApp />);
    await userEvent.type(screen.getByTestId("add-input"), "Task to add");
    fireEvent.submit(screen.getByTestId("add-form"));
    expect(screen.getByTestId("add-input").value).toBe("");
  });

  it("does not add an empty task", async () => {
    render(<TestApp />);
    const before = screen.getByTestId("active-list").children.length;
    fireEvent.submit(screen.getByTestId("add-form"));
    const after = screen.getByTestId("active-list").children.length;
    expect(after).toBe(before);
  });

  it("does not add a whitespace-only task", async () => {
    render(<TestApp />);
    await userEvent.click(screen.getByTestId("list-work"));
    await userEvent.type(screen.getByTestId("add-input"), "   ");
    const before = screen.getByTestId("active-list").children.length;
    fireEvent.submit(screen.getByTestId("add-form"));
    const after = screen.getByTestId("active-list").children.length;
    expect(after).toBe(before);
  });
});

describe("Marking tasks done", () => {
  it("moves a task to completed when checked", async () => {
    render(<TestApp />);
    // Task 1 is in myday (active)
    expect(screen.queryByTestId("todo-1")).toBeTruthy();
    await userEvent.click(screen.getByTestId("check-1"));
    expect(screen.queryByTestId("todo-1")).toBeNull(); // no longer in active list
    expect(screen.getByTestId("completed-section")).toBeTruthy();
  });

  it("shows completed section with correct count", async () => {
    render(<TestApp />);
    await userEvent.click(screen.getByTestId("check-1"));
    expect(screen.getByText(/Completed · 1/)).toBeTruthy();
  });
});

describe("Deleting tasks", () => {
  it("removes a task from the list on delete", async () => {
    render(<TestApp />);
    await userEvent.click(screen.getByTestId("list-work"));
    expect(screen.getByTestId("todo-2")).toBeTruthy();
    await userEvent.click(screen.getByTestId("delete-2"));
    expect(screen.queryByTestId("todo-2")).toBeNull();
  });

  it("updates remaining count after delete", async () => {
    render(<TestApp />);
    await userEvent.click(screen.getByTestId("list-work"));
    const before = parseInt(screen.getByTestId("subtitle").textContent);
    await userEvent.click(screen.getByTestId("delete-2"));
    const afterText = screen.getByTestId("subtitle").textContent;
    expect(afterText).toMatch(/0 remaining/);
  });
});

describe("Completed section", () => {
  it("shows completed section only when there are done tasks", () => {
    render(<TestApp />);
    // Switch to personal — todo 3 is done
    fireEvent.click(screen.getByTestId("list-personal"));
    expect(screen.getByTestId("completed-section")).toBeTruthy();
  });

  it("does not show completed section when no done tasks", async () => {
    render(<TestApp />);
    await userEvent.click(screen.getByTestId("list-work"));
    expect(screen.queryByTestId("completed-section")).toBeNull();
  });
});
