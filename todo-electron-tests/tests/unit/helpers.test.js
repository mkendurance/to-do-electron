// tests/unit/helpers.test.js
// Unit tests for pure helper functions used in the Todo app

import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Replicated helpers from App.jsx (test the logic in isolation) ──

function fmt(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

function todayStr() {
  return fmt(0);
}

function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

function firstDayOf(y, m) {
  return new Date(y, m, 1).getDay();
}

function calKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// ── Date Helper Tests ──────────────────────────────────────────────

describe("fmt() — date formatter", () => {
  it("returns today's date with offset 0", () => {
    const result = fmt(0);
    const today = new Date().toISOString().split("T")[0];
    expect(result).toBe(today);
  });

  it("returns tomorrow's date with offset 1", () => {
    const result = fmt(1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(result).toBe(tomorrow.toISOString().split("T")[0]);
  });

  it("returns yesterday with offset -1", () => {
    const result = fmt(-1);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(result).toBe(yesterday.toISOString().split("T")[0]);
  });

  it("returns a string in YYYY-MM-DD format", () => {
    const result = fmt(0);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("todayStr()", () => {
  it("matches today ISO string", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(todayStr()).toBe(today);
  });
});

// ── Calendar Helper Tests ──────────────────────────────────────────

describe("daysInMonth()", () => {
  it("returns 31 for January", () => {
    expect(daysInMonth(2024, 0)).toBe(31); // January = month 0
  });

  it("returns 28 for February in a non-leap year", () => {
    expect(daysInMonth(2023, 1)).toBe(28);
  });

  it("returns 29 for February in a leap year", () => {
    expect(daysInMonth(2024, 1)).toBe(29); // 2024 is a leap year
  });

  it("returns 30 for April", () => {
    expect(daysInMonth(2024, 3)).toBe(30);
  });

  it("returns 31 for December", () => {
    expect(daysInMonth(2024, 11)).toBe(31);
  });
});

describe("firstDayOf()", () => {
  it("returns the correct weekday for a known month", () => {
    // January 2024 started on a Monday (day 1)
    expect(firstDayOf(2024, 0)).toBe(1);
  });

  it("returns 0–6 (valid day of week)", () => {
    const result = firstDayOf(2024, 5); // June 2024
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(6);
  });
});

describe("calKey()", () => {
  it("formats date with zero-padded month and day", () => {
    expect(calKey(2024, 0, 5)).toBe("2024-01-05");
  });

  it("formats date correctly for double-digit month/day", () => {
    expect(calKey(2024, 11, 25)).toBe("2024-12-25");
  });

  it("returns a YYYY-MM-DD format string", () => {
    const key = calKey(2025, 2, 15);
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ── Todo Filtering Logic Tests ─────────────────────────────────────

describe("Todo filtering logic", () => {
  const today = todayStr();
  const tomorrow = fmt(1);

  const todos = [
    { id: 1, text: "Task A", list: "work",     done: false, starred: true,  date: today,    note: "" },
    { id: 2, text: "Task B", list: "shopping", done: false, starred: false, date: tomorrow, note: "" },
    { id: 3, text: "Task C", list: "myday",    done: true,  starred: false, date: today,    note: "" },
    { id: 4, text: "Task D", list: "personal", done: false, starred: false, date: "",       note: "some note" },
    { id: 5, text: "Task E", list: "work",     done: false, starred: true,  date: "",       note: "" },
  ];

  it("filters My Day — shows tasks dated today or in myday list", () => {
    const result = todos.filter(t => t.date === today || t.list === "myday");
    expect(result.map(t => t.id)).toContain(1);
    expect(result.map(t => t.id)).toContain(3);
    expect(result.map(t => t.id)).not.toContain(4);
  });

  it("filters Important — shows only starred tasks", () => {
    const result = todos.filter(t => t.starred);
    expect(result.map(t => t.id)).toEqual([1, 5]);
  });

  it("filters Planned — shows tasks with a date set", () => {
    const result = todos.filter(t => !!t.date);
    expect(result.map(t => t.id)).toEqual([1, 2, 3]);
    expect(result.map(t => t.id)).not.toContain(4);
  });

  it("filters by list id — work list", () => {
    const result = todos.filter(t => t.list === "work");
    expect(result.map(t => t.id)).toEqual([1, 5]);
  });

  it("separates active vs done correctly", () => {
    const active = todos.filter(t => !t.done);
    const done   = todos.filter(t => t.done);
    expect(active).toHaveLength(4);
    expect(done).toHaveLength(1);
    expect(done[0].id).toBe(3);
  });

  it("search filter — case insensitive match", () => {
    const query = "task a";
    const result = todos.filter(t =>
      t.text.toLowerCase().includes(query.toLowerCase())
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("search filter — no match returns empty", () => {
    const result = todos.filter(t =>
      t.text.toLowerCase().includes("xyz123")
    );
    expect(result).toHaveLength(0);
  });
});

// ── Overdue Detection Tests ────────────────────────────────────────

describe("Overdue detection", () => {
  it("flags a past date as overdue", () => {
    const pastDate = fmt(-5);
    const isOverdue = pastDate < todayStr();
    expect(isOverdue).toBe(true);
  });

  it("does not flag today as overdue", () => {
    const isOverdue = todayStr() < todayStr();
    expect(isOverdue).toBe(false);
  });

  it("does not flag a future date as overdue", () => {
    const futureDate = fmt(3);
    const isOverdue = futureDate < todayStr();
    expect(isOverdue).toBe(false);
  });
});

// ── Todo Mutation Logic Tests ──────────────────────────────────────

describe("Todo mutation (mutate patch logic)", () => {
  const todos = [
    { id: 1, text: "Buy milk", list: "shopping", done: false, starred: false, date: "", note: "" },
    { id: 2, text: "Write report", list: "work",  done: false, starred: true,  date: "", note: "" },
  ];

  function mutate(list, id, patch) {
    return list.map(t => (t.id === id ? { ...t, ...patch } : t));
  }

  it("toggles done on correct item", () => {
    const updated = mutate(todos, 1, { done: true });
    expect(updated[0].done).toBe(true);
    expect(updated[1].done).toBe(false);
  });

  it("does not mutate other items", () => {
    const updated = mutate(todos, 1, { starred: true });
    expect(updated[1].starred).toBe(true); // unchanged
    expect(updated[0].starred).toBe(true); // mutated
  });

  it("updates note correctly", () => {
    const updated = mutate(todos, 2, { note: "New note here" });
    expect(updated[1].note).toBe("New note here");
  });

  it("updates date correctly", () => {
    const updated = mutate(todos, 1, { date: "2025-12-25" });
    expect(updated[0].date).toBe("2025-12-25");
  });
});

// ── addTodo logic Tests ────────────────────────────────────────────

describe("addTodo logic", () => {
  function buildTodo(text, activeList, todayDate) {
    const smartLists = ["myday", "important", "planned"];
    return {
      id: Date.now(),
      text: text.trim(),
      list: smartLists.includes(activeList) ? "personal" : activeList,
      done: false,
      starred: activeList === "important",
      date: ["myday", "planned"].includes(activeList) ? todayDate : "",
      note: "",
    };
  }

  it("assigns personal list when adding to myday", () => {
    const t = buildTodo("New task", "myday", "2025-01-01");
    expect(t.list).toBe("personal");
  });

  it("sets today's date when adding to myday", () => {
    const t = buildTodo("New task", "myday", "2025-01-01");
    expect(t.date).toBe("2025-01-01");
  });

  it("marks as starred when adding to important", () => {
    const t = buildTodo("New task", "important", "2025-01-01");
    expect(t.starred).toBe(true);
  });

  it("does not set date when adding to work list", () => {
    const t = buildTodo("New task", "work", "2025-01-01");
    expect(t.date).toBe("");
  });

  it("trims whitespace from task text", () => {
    const t = buildTodo("  Buy milk  ", "personal", "2025-01-01");
    expect(t.text).toBe("Buy milk");
  });

  it("sets done to false by default", () => {
    const t = buildTodo("Task", "work", "2025-01-01");
    expect(t.done).toBe(false);
  });
});
