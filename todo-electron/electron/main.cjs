const { app, BrowserWindow } = require("electron");
const path = require("path");

const isDev =
  process.env.NODE_ENV === "development" ||
  process.env.PLAYWRIGHT === "true";

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 560,

    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },

    backgroundColor: "#F2F2F7",

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },

    show: false,
  });

  // ✅ DEV vs PROD loading
  if (isDev) {
    if (process.env.PLAYWRIGHT === "true") {
      win.loadFile(path.join(__dirname, "../dist/index.html"));
    } else {
      win.loadURL("http://127.0.0.1:5173/");
      win.webContents.openDevTools({ mode: "detach" });
    }
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  win.once("ready-to-show", () => {
    win.show();
  });
}

// ✅ App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});