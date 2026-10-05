const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");

const isDev = !app.isPackaged;
const PORT = 3000;
let mainWindow;
let nextServer;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function waitForServer(url, callback, attempts = 0) {
  http
    .get(url, (res) => {
      res.resume();
      callback();
    })
    .on("error", () => {
      if (attempts > 100) {
        dialog.showErrorBox(
          "Failed to start",
          "The application server did not start in time. Please restart the app."
        );
        app.quit();
        return;
      }
      setTimeout(() => waitForServer(url, callback, attempts + 1), 300);
    });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#ffffff",
    title: "Greenfield SMS",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

  // Open any target="_blank" links in the OS browser instead of a new Electron window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ---------------------------------------------------------------------------
// Production: run the Next.js server in-process against a per-user database
// ---------------------------------------------------------------------------

async function startProductionServer() {
  // Each installed copy of the app keeps its own database in the OS user-data
  // folder (NOT inside the read-only installed app), so data persists across
  // updates and multiple users on the same machine don't share one database.
  const userDataDir = path.join(app.getPath("userData"), "database");
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });
  process.env.UPLOAD_DIR = path.join(app.getPath("userData"), "uploads");
  const dbPath = path.join(userDataDir, "app.db");

  // First launch: seed the user's database from the bundled template so the
  // demo accounts and sample data are available immediately.
  if (!fs.existsSync(dbPath)) {
    const templateDb = path.join(process.resourcesPath, "template.db");
    if (fs.existsSync(templateDb)) {
      fs.copyFileSync(templateDb, dbPath);
    }
  }

  process.env.DATABASE_URL = `file:${dbPath}`;
  process.env.JWT_SECRET = process.env.JWT_SECRET || "change-this-super-secret-key-in-production-please";
  process.env.NODE_ENV = "production";

  // The Next.js production build (.next) and node_modules ship as extra
  // resources next to the app so native Prisma binaries can run unpacked
  // from asar (see electron-builder config in package.json).
  const appDir = path.join(process.resourcesPath, "app");

  const next = require(path.join(appDir, "node_modules", "next"));
  const nextApp = next({ dev: false, dir: appDir });
  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();

  nextServer = http.createServer((req, res) => handle(req, res));
  await new Promise((resolve) => nextServer.listen(PORT, "127.0.0.1", resolve));
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.on("ready", async () => {
  Menu.setApplicationMenu(buildMenu());

  if (isDev) {
    // In development, `npm run electron:dev` starts `next dev` on port 3000
    // separately; we just wait for it to be reachable and open the window.
    waitForServer(`http://localhost:${PORT}`, createWindow);
  } else {
    try {
      await startProductionServer();
      createWindow();
    } catch (err) {
      dialog.showErrorBox("Failed to start", String(err && err.stack ? err.stack : err));
      app.quit();
    }
  }
});

app.on("window-all-closed", () => {
  if (nextServer) nextServer.close();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

function buildMenu() {
  const template = [
    ...(process.platform === "darwin"
      ? [{ label: app.name, submenu: [{ role: "about" }, { type: "separator" }, { role: "quit" }] }]
      : []),
    {
      label: "File",
      submenu: [{ role: "reload" }, { role: "forceReload" }, { type: "separator" }, { role: "quit" }],
    },
    {
      label: "Edit",
      submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" }],
    },
    {
      label: "View",
      submenu: [{ role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { type: "separator" }, { role: "togglefullscreen" }, { role: "toggleDevTools" }],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
  ];
  return Menu.buildFromTemplate(template);
}
