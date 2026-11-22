const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("autoProDB", {
  fleet: () => ipcRenderer.invoke("fleet:list"),
  createFleet: (payload) => ipcRenderer.invoke("fleet:create", payload),
  updateFleet: (id, payload) => ipcRenderer.invoke("fleet:update", { id, payload }),
  deleteFleet: (id) => ipcRenderer.invoke("fleet:delete", id),
  bookings: () => ipcRenderer.invoke("bookings:list"),
  createBookings: (payload) => ipcRenderer.invoke("bookings:create", payload),
  updateBookingStatus: (id, status) => ipcRenderer.invoke("bookings:update-status", { id, status }),
  createPayment: (payload) => ipcRenderer.invoke("payments:create", payload),
  login: (username, password) => ipcRenderer.invoke("auth:login", { username, password }),
  register: (payload) => ipcRenderer.invoke("auth:register", payload),
  changePassword: (payload) => ipcRenderer.invoke("auth:change-password", payload),
  dashboard: () => ipcRenderer.invoke("dashboard:get"),
  legacyStorageKeys: () => ipcRenderer.invoke("legacy-storage:keys")
});
