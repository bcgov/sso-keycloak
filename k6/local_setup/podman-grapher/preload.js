const { contextBridge, ipcRenderer } = require('electron')

ipcRenderer.on('podmanData', (_e, data) => {
  // Creating a synthetic event so plotly can consume it.
  const event = new CustomEvent("podmanData", {detail: data});
  document.dispatchEvent(event);
})
