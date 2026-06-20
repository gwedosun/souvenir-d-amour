const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_PATH = path.join(__dirname, 'dates.json');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 850,
        minWidth: 900,
        minHeight: 700,
        icon: path.join(__dirname, 'icon.png'), // Opcional: adicione um ícone se quiser
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    // Remove a barra de menus padrão para parecer um software comercial limpo
    win.setMenuBarVisibility(false);
    win.loadFile('index.html');
}

// Ouvintes de segurança (IPC) para ler e escrever arquivos no computador
ipcMain.handle('read-dates', async () => {
    try {
        if (!fs.existsSync(DATA_PATH)) {
            fs.writeFileSync(DATA_PATH, JSON.stringify([], null, 4));
        }
        const data = fs.readFileSync(DATA_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
});

ipcMain.handle('write-dates', async (event, data) => {
    try {
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 4), 'utf8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});