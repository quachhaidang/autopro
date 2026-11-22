const path = require("node:path");
const { app, BrowserWindow, ipcMain } = require("electron");
const database = require("./db");

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  window.loadFile(path.join(__dirname, "..", "Website", "index.html"));
}

ipcMain.handle("fleet:list", () => {
  try {
    const fleet = database.listFleet();
    console.log(`[ipc] fleet:list returned ${fleet.length} vehicles`);
    return fleet;
  } catch (error) {
    console.error("[ipc] fleet:list failed:", error);
    throw error;
  }
});
ipcMain.handle("fleet:create", (_event, payload) => database.createFleet(payload));
ipcMain.handle("fleet:update", (_event, { id, payload }) => database.updateFleet(id, payload));
ipcMain.handle("fleet:delete", (_event, id) => database.deleteFleet(id));
ipcMain.handle("bookings:list", () => database.listBookings());
ipcMain.handle("bookings:create", (_event, payload) => database.createBookings(payload));
ipcMain.handle("bookings:update-status", (_event, { id, status }) => database.updateBookingStatus(id, status));
ipcMain.handle("payments:create", (_event, payload) => database.createPayment(payload));
ipcMain.handle("auth:login", (_event, { username, password }) => database.login(username, password));
ipcMain.handle("auth:register", (_event, payload) => database.register(payload));
ipcMain.handle("auth:change-password", (_event, payload) => database.changePassword(payload));
ipcMain.handle("dashboard:get", () => database.dashboard());
ipcMain.handle("legacy-storage:keys", () => database.clearLegacyStorage());

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
