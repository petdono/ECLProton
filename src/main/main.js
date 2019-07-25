/*
Copyright (c) 2019 Matt Worzala <bhop.me>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const { app, BrowserWindow, shell, ipcMain, Tray, Menu } = require('electron');
const log = require('electron-log');

const path = require('path');
const isDev = require('electron-is-dev');

const config = require('./config/config');

let mainWindow;
let tray;

// Fix to https://github.com/electron/electron/issues/13186
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

// electron log config
log.transports.console.format = '[{h}:{i}:{s} {level}] {text}';
log.transports.file.format = '[{m}/{d}/{y} {h}:{i}:{s} {level}] {text}';
log.transports.file.maxSize = 10 * 1024 * 1024;
log.transports.file.file = app.getPath('userData') + `/launcher_log${isDev ? '_dev' : ''}.log`;
// Use electron log for console.log calls.
console.log = (message) => {
    log.info(message);
};

if (process.platform === 'win32')
    app.setAppUserModelId(isDev ? process.execPath : 'me.bhop.proton');

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 950,
        minHeight: 550,
        frame: false,
        transparent: true,
        icon: app.getAppPath() + '/public/icon.png',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: false, //todo ideally this would be enabled for extra security.
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadURL(
        isDev
            ? 'http://localhost:3000'
            : `file://${path.join(__dirname, '../../build/index.html')}`,
    ).then(async () => {
        if ((await config.getValue('app/vibrancy')).value && (process.platform === 'win32' || process.platform === 'darwin'))
            require('electron-vibrancy').SetVibrancy(mainWindow, 2);
    });

    if (isDev) {
        const {
            default: installExtension,
            REACT_DEVELOPER_TOOLS,
        } = require('electron-devtools-installer');
        installExtension(REACT_DEVELOPER_TOOLS)
            .then(name => console.log(`Added Extension: ${name}`))
            .catch(err => console.log('An error occurred: ', err));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    let moveTimeout = null;
    mainWindow.on('move', () => {
        clearTimeout(moveTimeout);
        moveTimeout = setTimeout(() => {
            mainWindow.setSize(mainWindow.getSize()[0] + 1, mainWindow.getSize()[1] + 1);
            mainWindow.setSize(mainWindow.getSize()[0] - 1, mainWindow.getSize()[1] - 1);
        }, 50);
    });

    exports.window = mainWindow;
};

const createTrayMenu = () => {
    tray = new Tray(path.join(app.getAppPath() + '/public/icon.png'));
    tray.setContextMenu(Menu.buildFromTemplate([
        { label: 'Item1', type: 'normal' },
        { label: 'Item1', type: 'normal' },
        { type: 'separator' },
        { label: 'Item3', type: 'normal' }
    ]));
    tray.setToolTip('Proton Launcher');
    tray.addListener('click', () => mainWindow.focus());
};
const createContextMenu = () => {
    app.setUserTasks([
        {
            program: process.execPath,
            arguments: '--new-window',
            iconPath: __dirname + '/icon.png',
            iconIndex: 0,
            title: 'New Window',
            description: 'Create a new window'
        },
        {
            program: process.execPath,
            arguments: '--new-window',
            iconPath: __dirname + '/icon.png',
            iconIndex: 0,
            title: 'Test 2',
            description: 'I am a test option!'
        }
    ])
};

app.on('ready',  async () => {
    console.log('------------------------------------------');
    console.log('         Starting Proton Launcher         ');
    console.log('------------------------------------------');

    // Setup console debug
    const debug = (await config.getValue('app/developerMode')).value;
    console.debug = message => { if (debug) log.debug(message); };

    require('./app/protocol');
    require('./util/reporter');
    require('./app/updater');
    require('./task/taskmaster');
    require('./app/profile');
    require('./config/java');
    require('./mojang/accounts');
    require('./game/cache/versions');
    require('./game/cache/curse');
    require('./app/rpc');
    require('./app/theme/themes');

    //todo why is this settimeout here?
    setTimeout(() => {
        createWindow();

        // createTrayMenu();
        // if (process.platform === 'win32')
        //     createContextMenu();

        // Send warning about not pasting stuff.
        // mainWindow.webContents.on('devtools-opened', () => mainWindow.webContents.send('devtools-opened'));
    }, 100);

    app.on('second-instance', () => mainWindow.show());
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('open-url', async (event, data) => {
    console.log('open url');
    // event.preventDefault();
    // await shell.openExternal(data);
});

exports.sendSnack = data => mainWindow.send('snack:send', data);

let maximized = false;
ipcMain.on('titlebar:quit', () => mainWindow.close());
ipcMain.on('titlebar:maximize', () => {
    if (maximized)
        mainWindow.unmaximize();
    else mainWindow.maximize();
    maximized = !maximized;
});
ipcMain.on('titlebar:minimize', () => mainWindow.minimize());

ipcMain.on('open-external', async (event, arg) => {
    await shell.openExternal(arg);
});

ipcMain.on('open-folder', async (event, arg) => {
    console.log('opening' + arg);
    await shell.openItem(arg);
});
ipcMain.on('open-item', async (event, arg) => {
    await shell.showItemInFolder(arg);
});

ipcMain.on('argv', async event => {

    const t = require('./task/taskmaster');
    const tid = t.createTask("test");
    await t.runJob(tid, 'test', {});

    event.sender.send('argv', process.argv);
    event.sender.send('argv', app.getAppPath());
    event.sender.send('argv', path.join(require('electron').app.getPath('userData'), 'Install'));
});

ipcMain.on('util:isDev', event => event.returnValue = isDev);

ipcMain.on('launcher:restart', () => {
    app.relaunch({ args: process.argv.slice(1) });
    app.exit(0)
});

ipcMain.once('sync', async event => {
    event.returnValue = {
        vibrancy: await config.getValue('app/vibrancy')
    }
});

process.on('unhandledRejection', (reason, p) => {
    console.log('UNHANDLED REJECTION');
    console.log(reason);
    console.log(p);
});
process.on('uncaughtException', err => {
    console.log('UNHANDLED EXCEPTION');
    console.log(err);
});

// require('node-fetch')(`https://addons-ecs.forgesvc.net/api/v2/addon/search?gameId=432&pageSize=20&index=0&sort=Featured&searchFilter=&gameVersion=&categoryId=0&sectionId=4471&sortDescending=false`, {
//     headers: { "User-Agent": "Launcher (https://github.com/bhopahk/launcher/)" }
    // headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) twitch-desktop-electron-platform/1.0.0 Chrome/66.0.3359.181 Twitch/3.0.16 Safari/537.36 desklight/8.40.1" }
// }).then(resp => resp.json()).then(json => console.log(json));
