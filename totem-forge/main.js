const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const printer = require("@thiagoelg/node-printer");
const os = require("os");

var Hashids = require("hashids");
var encrypter = new Hashids("gatito esponjoso");
var convert = (from, to) => (str) => Buffer.from(str, from).toString(to);
var utf8ToHex = convert("utf8", "hex");

//
// SETUP ENVIRONMENT
//

// const APP_URL = "http://192.168.1.154:3000";
// const API_URL = "http://192.168.1.154:12345";
// process.env.IS_DEBUG = 1;

const APP_URL = "https://tot.bambus.tech";
const API_URL = "https://tot.bambus.tech/api";

process.env.HOSTNAME = os.hostname();
process.env.TOTEM_TOKEN = encrypter.encodeHex(utf8ToHex(process.env.HOSTNAME));
process.env.API_URL = API_URL;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1080,
    height: 1920,
    kiosk: process.env.IS_DEBUG ? false : true,
    alwaysOnTop: process.env.IS_DEBUG ? false : true,
    autoHideMenuBar: process.env.IS_DEBUG ? false : true,
    webPreferences: {
      devTools: process.env.IS_DEBUG ? true : false,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.webContents.on("did-fail-load", () => {
    mainWindow.loadFile("src/error.html");
    setTimeout(() => {
      mainWindow.loadURL(APP_URL);
    }, 5000);
  });

  // and load the index.html of the app.
  mainWindow.loadURL(APP_URL);
  if (process.env.IS_DEBUG) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on("EXIT", (event) => {
  app.quit();
});

ipcMain.on("PRINT", (event, qty, tags) => {
  console.log("TOTEM-FORGE | PRINT | QTY:", qty);

  var promises = [];
  for (var i = 0; i < qty; i++) {
    promises.push(
      new Promise((resolve, reject) => {
        printer.printDirect({
          data: tags[i] || " ",
          type: "TEXT",
          success: () => {
            console.log("TOTEM-FORGE | PRINT | PRINTED IDX:", i, "(tag: ", tags[i] || " ", ")");
            resolve();
          },
          error: (err) => {
            console.error("TOTEM-FORGE | PRINT | ERROR PRINT IDX:", i, err, "(tag: ", tags[i] || " ", ")");
            reject();
          },
        });
      })
    );
  }

  Promise.all(promises)
    .then(() => {
      console.log("TOTEM-FORGE | PRINT | Success.");
      event.reply("PRINT_END");
    })
    .catch((err) => {
      console.error("TOTEM-FORGE | PRINT | Error.", err);
      event.reply("PRINT_ERROR", err);
    });
});
