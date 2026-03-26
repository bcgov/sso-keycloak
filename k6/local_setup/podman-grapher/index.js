const { app, BrowserWindow, ipcMain } = require('electron')
const { spawn } = require('child_process');
const path = require('path')

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            preload: path.resolve(__dirname, 'preload.js'),
            nodeIntegration: true,
        },
    })

    win.loadFile('index.html')
    return win
}

app.whenReady().then(() => {
    const win = createWindow()
    const stats = spawn('podman stats -i 2 --format "table {{.CPUPerc}}, {{.MemPerc}}" keycloak', { shell: true })

    // Handle data from the child process and send it to the renderer process
    stats.stdout.on('data', (data) => {
        try {
            const dataLine = data.toString().split('\n')[1]
            const [cpuPercent, memoryPercent] = dataLine.split(',')
            // Send data to the renderer process for graphing
            win.webContents.send('podmanData', {cpuPercent, memoryPercent});
        } catch (e) {
            console.error('Error while parsing podman stats', e);
            return
        }
    });
})
