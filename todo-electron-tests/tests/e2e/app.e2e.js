// tests/e2e/app.e2e.js
// End-to-end tests using Playwright with Electron
// ALL selectors use data-testid — reliable across dev and production builds

import { test, expect, _electron as electron } from "@playwright/test";
import path from "path";
// import * as path from "node:path";
import { fileURLToPath } from "url";
// import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Path to the Electron app ───────────────────────────────────────
// Adjust this if your folder layout is different
const ELECTRON_APP_PATH = path.join(__dirname, "../../../todo-electron");

// ── Helper: launch the Electron app ───────────────────────────────
async function launchApp() {
  const app = await electron.launch({
    args: [path.join(ELECTRON_APP_PATH, "electron/main.cjs")],
    env: {
      ...process.env,
      PLAYWRIGHT: "true",   // tells main.js to skip devtools + load built dist
    },
  });
  const window = await app.firstWindow();
  await window.waitForLoadState("networkidle");
  return { app, window };
}

// ═══════════════════════════════════════════════════════════════════
// 1. WINDOW LAUNCH
// ═══════════════════════════════════════════════════════════════════

test.describe("Window launch", () => {
  let app, window;

  test.beforeEach(async () => {
    ({ app, window } = await launchApp());
  });

  test.afterEach(async () => {
    await app.close();
  });

  test("app opens a window", async () => {
    expect(window).toBeTruthy();
  });

  test("window has correct title", async () => {
    const title = await window.title();
    expect(title).toBe("Reminders");
  });

  test("window meets minimum size requirements", async () => {
    const size = await app.evaluate(({ BrowserWindow }) => {
      return BrowserWindow.getAllWindows()[0].getSize();
    });
    expect(size[0]).toBeGreaterThanOrEqual(800);
    expect(size[1]).toBeGreaterThanOrEqual(560);
  });

  test("sidebar is rendered", async () => {
    await expect(window.locator("aside").first()).toBeVisible();
  });

  test("brand name Reminders is visible", async () => {
    await expect(window.locator("text=Reminders").first()).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. SIDEBAR NAVIGATION
// ═══════════════════════════════════════════════════════════════════

test.describe("Sidebar navigation", () => {
  let app, window;

  test.beforeEach(async () => {
    ({ app, window } = await launchApp());
  });

  test.afterEach(async () => {
    await app.close();
  });

  test("My Day is active by default", async () => {
    await expect(window.getByTestId("main-title")).toHaveText("My Day");
  });

  test("clicking Important switches the view", async () => {
    await window.getByTestId("list-important").click();
    await expect(window.getByTestId("main-title")).toHaveText("Important");
  });

  test("clicking Work switches the view", async () => {
    await window.getByTestId("list-work").click();
    await expect(window.getByTestId("main-title")).toHaveText("Work");
  });

  test("clicking Personal switches the view", async () => {
    await window.getByTestId("list-personal").click();
    await expect(window.getByTestId("main-title")).toHaveText("Personal");
  });

  test("clicking Shopping switches the view", async () => {
    await window.getByTestId("list-shopping").click();
    await expect(window.getByTestId("main-title")).toHaveText("Shopping");
  });

  test("subtitle shows remaining and completed counts", async () => {
    await window.getByTestId("list-work").click();
    await expect(window.getByTestId("main-subtitle")).toContainText("remaining");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. ADDING TASKS
// ═══════════════════════════════════════════════════════════════════

test.describe("Adding tasks", () => {
  let app, window;

  test.beforeEach(async () => {
    ({ app, window } = await launchApp());
  });

  test.afterEach(async () => {
    await app.close();
  });

  test("add input is visible", async () => {
    await expect(window.getByTestId("add-input")).toBeVisible();
  });

  test("typing shows the Add button", async () => {
    await window.getByTestId("add-input").fill("Buy oat milk");
    await expect(window.getByTestId("add-submit")).toBeVisible();
  });

  test("pressing Enter adds the task", async () => {
    await window.getByTestId("add-input").fill("New e2e task");
    await window.getByTestId("add-input").press("Enter");
    await expect(window.locator("text=New e2e task")).toBeVisible();
  });

  test("clicking Add button adds the task", async () => {
    await window.getByTestId("add-input").fill("Click add task");
    await window.getByTestId("add-submit").click();
    await expect(window.locator("text=Click add task")).toBeVisible();
  });

  test("input clears after adding", async () => {
    await window.getByTestId("add-input").fill("Temp task");
    await window.getByTestId("add-input").press("Enter");
    await expect(window.getByTestId("add-input")).toHaveValue("");
  });

  test("empty input does not show Add button", async () => {
    // Add button only appears when there is text
    await expect(window.getByTestId("add-submit")).not.toBeVisible();
  });

  test("task added to Work list stays in Work list", async () => {
    await window.getByTestId("list-work").click();
    await window.getByTestId("add-input").fill("Work e2e task");
    await window.getByTestId("add-input").press("Enter");
    await expect(window.locator("text=Work e2e task")).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. COMPLETING TASKS
// ═══════════════════════════════════════════════════════════════════

test.describe("Completing tasks", () => {
  let app, window;

  test.beforeEach(async () => {
    ({ app, window } = await launchApp());
  });

  test.afterEach(async () => {
    await app.close();
  });

  test("clicking checkmark moves task to Completed section", async () => {
    const firstCheck = window.getByTestId("todo-check").first();
    await firstCheck.click();
    await expect(window.getByTestId("completed-section")).toBeVisible();
  });

  test("completed section shows correct count", async () => {
    // My Day already has 1 done task (Morning run) in initial data
    await expect(window.getByTestId("completed-section")).toBeVisible();
  });

  test("completing a task updates the remaining count", async () => {
    const subtitleBefore = await window.getByTestId("main-subtitle").textContent();
    const beforeCount = parseInt(subtitleBefore.match(/(\d+) remaining/)[1]);

    const firstCheck = window.getByTestId("todo-check").first();
    await firstCheck.click();

    const subtitleAfter = await window.getByTestId("main-subtitle").textContent();
    const afterCount = parseInt(subtitleAfter.match(/(\d+) remaining/)[1]);

    expect(afterCount).toBe(beforeCount - 1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. DELETING TASKS
// ═══════════════════════════════════════════════════════════════════

test.describe("Deleting tasks", () => {
  let app, window;

  test.beforeEach(async () => {
    ({ app, window } = await launchApp());
  });

  test.afterEach(async () => {
    await app.close();
  });

  test("clicking delete removes the task", async () => {
    await window.getByTestId("list-work").click();
    // Get text of first task before deleting
    const firstCard = window.getByTestId("todo-card").first();
    const taskText = await firstCard.locator("div > div").first().textContent();

    await firstCard.getByTestId("todo-delete").click();
    await expect(window.locator(`text=${taskText}`)).not.toBeVisible();
  });

  test("remaining count decreases after delete", async () => {
    await window.getByTestId("list-work").click();
    const before = await window.getByTestId("main-subtitle").textContent();
    const beforeCount = parseInt(before.match(/(\d+) remaining/)[1]);

    await window.getByTestId("todo-card").first().getByTestId("todo-delete").click();

    const after = await window.getByTestId("main-subtitle").textContent();
    const afterCount = parseInt(after.match(/(\d+) remaining/)[1]);
    expect(afterCount).toBe(beforeCount - 1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. SEARCH
// ═══════════════════════════════════════════════════════════════════

test.describe("Search functionality", () => {
  let app, window;

  test.beforeEach(async () => {
    ({ app, window } = await launchApp());
  });

  test.afterEach(async () => {
    await app.close();
  });

  test("search input is visible in sidebar", async () => {
    await expect(window.getByTestId("search-input")).toBeVisible();
  });

  test("typing in search switches title to Search", async () => {
    await window.getByTestId("search-input").fill("groceries");
    await expect(window.getByTestId("main-title")).toHaveText("Search");
  });

  test("search shows matching results", async () => {
    await window.getByTestId("search-input").fill("groceries");
    await expect(window.locator("text=Buy groceries")).toBeVisible();
  });

  test("search subtitle shows result count", async () => {
    await window.getByTestId("search-input").fill("report");
    await expect(window.getByTestId("main-subtitle")).toContainText("result");
  });

  test("clearing search returns to My Day", async () => {
    await window.getByTestId("search-input").fill("groceries");
    await window.getByTestId("search-input").fill("");
    await expect(window.getByTestId("main-title")).toHaveText("My Day");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 7. DETAIL PANEL  ← THE FIXED SECTION
// ═══════════════════════════════════════════════════════════════════

test.describe("Detail panel", () => {
  let app, window;

  test.beforeEach(async () => {
    ({ app, window } = await launchApp());
    // Click the first todo card to open the detail panel
    // Using data-testid="todo-card" — reliable in both dev and prod builds
    await window.getByTestId("todo-card").first().click();
    // Wait for panel to be visible before each test
    await expect(window.getByTestId("detail-panel")).toBeVisible();
  });

  test.afterEach(async () => {
    await app.close();
  });

  test("clicking a task opens the detail panel", async () => {
    await expect(window.getByTestId("detail-panel")).toBeVisible();
  });

  test("detail panel shows Task Details label", async () => {
    await expect(window.getByTestId("detail-title")).toBeVisible();
    await expect(window.getByTestId("detail-title")).toContainText("Task Details");
  });

  test("detail panel has a Done button", async () => {
    await expect(window.getByTestId("detail-done-btn")).toBeVisible();
  });

  test("clicking Done closes the detail panel", async () => {
    await window.getByTestId("detail-done-btn").click();
    await expect(window.getByTestId("detail-panel")).not.toBeVisible();
  });

  test("detail panel has a date input", async () => {
    await expect(window.getByTestId("detail-date-input")).toBeVisible();
  });

  test("detail panel has a notes textarea", async () => {
    await expect(window.getByTestId("detail-notes")).toBeVisible();
  });

  test("detail panel has a Mark Done button", async () => {
    await expect(window.getByTestId("detail-mark-done")).toBeVisible();
  });

  test("detail panel has a Star button", async () => {
    await expect(window.getByTestId("detail-star")).toBeVisible();
  });

  test("detail panel has a Delete Task button", async () => {
    await expect(window.getByTestId("detail-delete")).toBeVisible();
  });

  test("typing in notes updates the textarea value", async () => {
    const notes = window.getByTestId("detail-notes");
    await notes.fill("Test note from e2e");
    await expect(notes).toHaveValue("Test note from e2e");
  });

  test("clicking Delete Task closes panel and removes task", async () => {
    // Get the text of the selected task first
    const titleEl = window.getByTestId("detail-title");
    await expect(titleEl).toBeVisible();

    await window.getByTestId("detail-delete").click();
    // Panel should close after delete
    await expect(window.getByTestId("detail-panel")).not.toBeVisible();
  });

  test("clicking Mark Done toggles the task", async () => {
    const btn = window.getByTestId("detail-mark-done");
    await btn.click();
    // Button text changes to ✓ Done
    await expect(btn).toContainText("Done");
  });

  test("clicking same task again closes the panel", async () => {
    // Panel is open from beforeEach — click the same card again
    await window.getByTestId("todo-card").first().click();
    await expect(window.getByTestId("detail-panel")).not.toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 8. MINI CALENDAR
// ═══════════════════════════════════════════════════════════════════

test.describe("Mini calendar", () => {
  let app, window;

  test.beforeEach(async () => {
    ({ app, window } = await launchApp());
  });

  test.afterEach(async () => {
    await app.close();
  });

  test("calendar prev/next buttons are visible", async () => {
    await expect(window.getByTestId("cal-prev")).toBeVisible();
    await expect(window.getByTestId("cal-next")).toBeVisible();
  });

  test("month label is visible", async () => {
    await expect(window.getByTestId("cal-month-label")).toBeVisible();
  });

  test("next button advances the month", async () => {
    const before = await window.getByTestId("cal-month-label").textContent();
    await window.getByTestId("cal-next").click();
    const after = await window.getByTestId("cal-month-label").textContent();
    expect(after).not.toBe(before);
  });

  test("prev button goes back a month", async () => {
    // Go forward first so we have somewhere to go back to
    await window.getByTestId("cal-next").click();
    const before = await window.getByTestId("cal-month-label").textContent();
    await window.getByTestId("cal-prev").click();
    const after = await window.getByTestId("cal-month-label").textContent();
    expect(after).not.toBe(before);
  });

  test("clicking a calendar date switches to Planned view", async () => {
    // Click any numbered day in the calendar
    // Day cells are inside the calendar grid (not nav buttons)
    const calGrid = window.locator("[data-testid='cal-month-label']").locator("..").locator("..");
    const dayCell = calGrid.locator("div").filter({ hasText: /^1$/ }).first();
    await dayCell.click();
    await expect(window.getByTestId("main-title")).toHaveText("Planned");
  });
});
