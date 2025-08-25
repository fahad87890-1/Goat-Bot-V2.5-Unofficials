// Set bash title
process.stdout.write("\x1b]2;Goat Bot V2 - Made by NTKhang\x1b\x5c");

const gradient = require("gradient-string");
const axios = require("axios");
const path = require("path");
const fs = require("fs-extra");
const login = require(`${process.cwd()}/fb-chat-api`);

const { writeFileSync, readFileSync, existsSync, watch } = fs;
const handlerWhenListenHasError = require("./handlerWhenListenHasError.js");
const { callbackListenTime, storage5Message } = global.GoatBot;
const {
  log,
  logColor,
  createOraDots,
  jsonStringifyColor,
  getText,
  convertTime,
  colors,
  randomString,
} = global.utils;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const currentVersion = require(`${process.cwd()}/package.json`).version;

// Flags for fbstate write tracking and change detection
let changeFbStateByCode = false;
let latestChangeContentAccount = 0;

function centerText(text, length) {
  const width = process.stdout.columns;
  const leftPadding = Math.floor((width - (length || text.length)) / 2);
  const rightPadding = width - leftPadding - (length || text.length);
  console.log(
    " ".repeat(leftPadding > 0 ? leftPadding : 0) +
    text +
    " ".repeat(rightPadding > 0 ? rightPadding : 0)
  );
}

// Logo
const titles = [
  [
    " ██████╗  ██████╗  █████╗ ████████╗    ██████╗  ██████╗ ████████╗    ██╗   ██╗██████╗            ███████╗",
    "██╔════╝ ██╔═══██╗██╔══██╗╚══██╔══╝    ██╔══██╗██╔═══██╗╚══██╔══╝    ██║   ██║╚════██╗           ██╔════╝",
    "██║  ███╗██║   ██║███████║   ██║       ██████╔╝██║   ██║   ██║       ██║   ██║ █████╔╝           ███████╗",
    "██║   ██║██║   ██║██╔══██║   ██║       ██╔══██╗██║   ██║   ██║       ╚██╗ ██╔╝██╔═══╝            ╚════██║",
    "╚██████╔╝╚██████╔╝██║  ██║   ██║       ██████╔╝╚██████╔╝   ██║        ╚████╔╝ ███████╗    ██╗    ███████║",
    "╚═════╝  ╚═════╝ ╚═╝  ╚═╝   ╚═╝       ╚═════╝  ╚═════╝    ╚═╝         ╚═══╝  ╚══════╝    ╚═╝    ╚══════╝",
  ],
  [
    "█▀▀ █▀█ ▄▀█ ▀█▀  █▄▄ █▀█ ▀█▀  █░█ ▀█",
    "█▄█ █▄█ █▀█ ░█░  █▄█ █▄█ ░█░  ▀▄▀ █▄",
  ],
  ["G O A T   B O T   V 2.5 @" + currentVersion],
  ["GOATBOT V2.5"],
];
const maxWidth = process.stdout.columns;
const title =
  maxWidth > 58 ? titles[0]
    : maxWidth > 36 ? titles[1]
      : maxWidth > 26 ? titles[2]
        : titles[3];

console.log(gradient("#f5af19", "#f12711")(createLine(null, true)));
console.log();
for (const text of title) {
  centerText(gradient("#FA8BFF", "#2BD2FF", "#2BFF88")(text), text.length);
}

const subTitle = "GoatBot V2.5 Unofficials - A simple Bot chat messenger use personal account";
const subTitleArray = [];
let tempSub = subTitle;
if (subTitle.length > maxWidth) {
  while (tempSub.length > maxWidth) {
    let lastSpace = tempSub.slice(0, maxWidth).lastIndexOf(" ");
    lastSpace = lastSpace === -1 ? maxWidth : lastSpace;
    subTitleArray.push(tempSub.slice(0, lastSpace).trim());
    tempSub = tempSub.slice(lastSpace).trim();
  }
  if (tempSub) subTitleArray.push(tempSub);
} else {
  subTitleArray.push(subTitle);
}
const author = "Created by NTKhang with ♡";
const srcUrl = "Source code: https://github.com/ntkhang03/Goat-Bot-V2";
const fakeRelease = "ALL VERSIONS NOT RELEASED HERE ARE FAKE";
for (const t of subTitleArray) {
  centerText(gradient("#9F98E8", "#AFF6CF")(t), t.length);
}
centerText(gradient("#9F98E8", "#AFF6CF")(author), author.length);
centerText(gradient("#9F98E8", "#AFF6CF")(srcUrl), srcUrl.length);
centerText(gradient("#f5af19", "#f12711")(fakeRelease), fakeRelease.length);

let widthConsole = process.stdout.columns;
if (widthConsole > 50) widthConsole = 50;

function createLine(content, isMaxWidth = false) {
  if (!content)
    return Array(isMaxWidth ? process.stdout.columns : widthConsole).fill("─").join("");
  content = ` ${content.trim()} `;
  const lengthContent = content.length;
  const lengthLine = (isMaxWidth ? process.stdout.columns : widthConsole) - lengthContent;
  let left = Math.floor(lengthLine / 2);
  if (left < 0 || isNaN(left)) left = 0;
  const lineOne = Array(left).fill("─").join("");
  return lineOne + content + lineOne;
}

const character = createLine();

async function getName(userID) {
  try {
    const user = await axios.post(
      `https://www.facebook.com/api/graphql/?q=${`node(${userID}){name}`}`
    );
    return user.data[userID].name;
  } catch {
    return null;
  }
}

const { dirAccount } = global.client;

const intervalGetNewCookie = global.GoatBot.config.facebookAccount?.intervalGetNewCookie;
const AUTLOGIN_INTERVAL = typeof intervalGetNewCookie === 'number' && intervalGetNewCookie > 0
  ? intervalGetNewCookie * 60 * 1000
  : null;

// Hàm kiểm tra appState hết hạn
function isExpiredAppState(filePath) {
  if (!AUTLOGIN_INTERVAL) return false;
  try {
    const stats = fs.statSync(filePath);
    return (Date.now() - stats.mtimeMs) > AUTLOGIN_INTERVAL;
  } catch {
    return true;
  }
}

const autologin = require('./autologin.js');

// Convert a cookie string (e.g., "c_user=...; xs=...; fr=...; datr=...") to appState array
function cookieToAppState(cookieString) {
  if (!cookieString || typeof cookieString !== 'string') return [];
  return cookieString
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .map(pair => {
      const eqIndex = pair.indexOf('=');
      const key = eqIndex !== -1 ? pair.slice(0, eqIndex).trim() : pair.trim();
      const value = eqIndex !== -1 ? pair.slice(eqIndex + 1).trim() : '';
      return {
        key,
        value,
        domain: 'facebook.com',
        path: '/',
        expires: Date.now() + 1000 * 60 * 60 * 24 * 365
      };
    });
}

async function getAppStateToLogin() {
  let needAutologin = false;
  if (!existsSync(dirAccount) || isExpiredAppState(dirAccount)) {
    needAutologin = true;
  } else {
    try {
      const accountText = readFileSync(dirAccount, "utf8");
      const appState = JSON.parse(accountText);
      if (!Array.isArray(appState) || !appState.some(i => i.key && i.value)) {
        needAutologin = true;
      } else {
        return appState;
      }
    } catch (err) {
      log.error("LOGIN FACEBOOK", "appState invalid or not found", err.message);
      needAutologin = true;
    }
  }

  if (needAutologin) {
    log.info("LOGIN FACEBOOK", "Automatically fetching new appState/cookie using autologin...");
    const reloginResult = await autologin.handleRelogin();
    if (!reloginResult) {
      log.error("AUTOLOGIN", "Unable to fetch new appState/cookie.");
      process.exit(1);
    }
    // Read the new cookie just written to the cookie.txt file
    const cookiePath = require('path').join(process.cwd(), 'account.txt');
    if (!existsSync(cookiePath)) {
      log.error("AUTOLOGIN", "Unable to find account.txt file after autologin.");
      process.exit(1);
    }
    const cookieString = readFileSync(cookiePath, "utf8");
    const appState = cookieToAppState(cookieString);
    writeFileSync(dirAccount, JSON.stringify(appState, null, 2));
    log.info("LOGIN FACEBOOK", "Successfully fetched new appState/cookie!");
    return appState;
  }
}

function stopListening(keyListen) {
  keyListen = keyListen || Object.keys(callbackListenTime).pop();
  return new Promise((resolve) => {
    global.GoatBot.fcaApi.stopListening?.(() => {
      if (callbackListenTime[keyListen]) callbackListenTime[keyListen] = () => { };
      resolve();
    }) || resolve();
  });
}

async function startBot() {
  console.log(colors.hex("#f5ab00")(createLine("START LOGGING IN", true)));

  if (global.GoatBot.Listening) await stopListening();

  log.info("LOGIN FACEBOOK", getText("login", "currentlyLogged"));

  let appState = await getAppStateToLogin();
  changeFbStateByCode = true;
  writeFileSync(dirAccount, JSON.stringify(appState, null, 2));
  setTimeout(() => (changeFbStateByCode = false), 1000);

  (function loginBot(appState) {
    global.GoatBot.commands = new Map();
    global.GoatBot.eventCommands = new Map();
    global.GoatBot.aliases = new Map();
    global.GoatBot.onChat = [];
    global.GoatBot.onEvent = [];
    global.GoatBot.onReply = new Map();
    global.GoatBot.onReaction = new Map();
    clearInterval(global.intervalRestartListenMqtt);
    delete global.intervalRestartListenMqtt;

    let isSendNotiErrorMessage = false;

    login(
      { appState },
      global.GoatBot.config.optionsFca,
      async function (error, api) {
        if (error) {
          log.err("LOGIN FACEBOOK", getText("login", "loginError"), error);
          global.statusAccountBot = "can't login";
          process.exit();
        }

        global.GoatBot.fcaApi = api;
        global.GoatBot.botID = api.getCurrentUserID();
        log.info("LOGIN FACEBOOK", getText("login", "loginSuccess"));
        global.botID = api.getCurrentUserID();
        logColor("#f5ab00", createLine("BOT INFO"));
        log.info("NODE VERSION", process.version);
        log.info("PROJECT VERSION", currentVersion);
        log.info("BOT ID", `${global.botID} - ${await getName(global.botID)}`);
        log.info("PREFIX", global.GoatBot.config.prefix);
        log.info("LANGUAGE", global.GoatBot.config.language);
        log.info("BOT NICK NAME", global.GoatBot.config.nickNameBot || "GOAT BOT");

        // Show key FCA options for visibility
        try {
          const fcaOpts = global.GoatBot.config.optionsFca || {};
          log.info("FCA OPTIONS", `listenTyping=${!!fcaOpts.listenTyping}, selfListen=${!!fcaOpts.selfListen}, selfListenEvent=${!!fcaOpts.selfListenEvent}`);
        } catch (_) { }

        // Notifications
        let notification;
        try {
          const getNoti = await axios.get(
            "https://raw.githubusercontent.com/ntkhang03/Goat-Bot-V2-Gban/master/notification.txt"
          );
          notification = getNoti.data;
        } catch {
          log.err("ERROR", "Can't get notifications data");
          process.exit();
        }

        // Auto refresh fbstate
        if (global.GoatBot.config.autoRefreshFbstate === true) {
          changeFbStateByCode = true;
          try {
            writeFileSync(
              dirAccount,
              JSON.stringify(api.getAppState(), null, 2)
            );
            log.info(
              "REFRESH FBSTATE",
              getText("login", "refreshFbstateSuccess", path.basename(dirAccount))
            );
          } catch (err) {
            log.warn(
              "REFRESH FBSTATE",
              getText("login", "refreshFbstateError", path.basename(dirAccount)),
              err
            );
          }
          setTimeout(() => (changeFbStateByCode = false), 1000);
        }

        // Load data
        const {
          threadModel,
          userModel,
          globalModel,
          threadsData,
          usersData,
          globalData,
          sequelize,
        } = await require(process.env.NODE_ENV === "development"
          ? "./loadData.dev.js"
          : "./loadData.js")(api, createLine);

        // Load scripts
        await require(process.env.NODE_ENV === "development"
          ? "./loadScripts.dev.js"
          : "./loadScripts.js")(
            api,
            threadModel,
            userModel,
            globalModel,
            threadsData,
            usersData,
            globalData,
            createLine
          );

        // Auto load scripts
        if (global.GoatBot.config.autoLoadScripts?.enable === true) {
          const ignoreCmds =
            global.GoatBot.config.autoLoadScripts.ignoreCmds
              ?.replace(/[ ,]+/g, " ")
              .trim()
              .split(" ") || [];
          const ignoreEvents =
            global.GoatBot.config.autoLoadScripts.ignoreEvents
              ?.replace(/[ ,]+/g, " ")
              .trim()
              .split(" ") || [];

          watch(`${process.cwd()}/scripts/cmds`, async (event, filename) => {
            if (filename.endsWith(".js")) {
              if (ignoreCmds.includes(filename) || filename.endsWith(".eg.js")) return;
              if (
                (event === "change" || event === "rename") &&
                existsSync(`${process.cwd()}/scripts/cmds/${filename}`)
              ) {
                try {
                  const contentCommand = global.temp.contentScripts.cmds[filename] || "";
                  const currentContent = readFileSync(
                    `${process.cwd()}/scripts/cmds/${filename}`,
                    "utf-8"
                  );
                  if (contentCommand === currentContent) return;
                  global.temp.contentScripts.cmds[filename] = currentContent;
                  filename = filename.replace(".js", "");

                  const infoLoad = global.utils.loadScripts(
                    "cmds",
                    filename,
                    log,
                    global.GoatBot.configCommands,
                    api,
                    threadModel,
                    userModel,
                    globalModel,
                    threadsData,
                    usersData,
                    globalData
                  );
                  if (infoLoad.status === "success")
                    log.master(
                      "AUTO LOAD SCRIPTS",
                      `Command ${filename}.js (${infoLoad.command.config.name}) has been reloaded`
                    );
                  else
                    log.err(
                      "AUTO LOAD SCRIPTS",
                      `Error when reload command ${filename}.js`,
                      infoLoad.error
                    );
                } catch (err) {
                  log.err(
                    "AUTO LOAD SCRIPTS",
                    `Error when reload command ${filename}.js`,
                    err
                  );
                }
              }
            }
          });

          watch(`${process.cwd()}/scripts/events`, async (event, filename) => {
            if (filename.endsWith(".js")) {
              if (ignoreEvents.includes(filename) || filename.endsWith(".eg.js")) return;
              if (
                (event === "change" || event === "rename") &&
                existsSync(`${process.cwd()}/scripts/events/${filename}`)
              ) {
                try {
                  const contentEvent = global.temp.contentScripts.events[filename] || "";
                  const currentContent = readFileSync(
                    `${process.cwd()}/scripts/events/${filename}`,
                    "utf-8"
                  );
                  if (contentEvent === currentContent) return;
                  global.temp.contentScripts.events[filename] = currentContent;
                  filename = filename.replace(".js", "");

                  const infoLoad = global.utils.loadScripts(
                    "events",
                    filename,
                    log,
                    global.GoatBot.configCommands,
                    api,
                    threadModel,
                    userModel,
                    globalModel,
                    threadsData,
                    usersData,
                    globalData
                  );
                  if (infoLoad.status === "success")
                    log.master(
                      "AUTO LOAD SCRIPTS",
                      `Event ${filename}.js (${infoLoad.command.config.name}) has been reloaded`
                    );
                  else
                    log.err(
                      "AUTO LOAD SCRIPTS",
                      `Error when reload event ${filename}.js`,
                      infoLoad.error
                    );
                } catch (err) {
                  log.err(
                    "AUTO LOAD SCRIPTS",
                    `Error when reload event ${filename}.js`,
                    err
                  );
                }
              }
            }
          });
        }

        // Admin bot info
        logColor("#f5ab00", character);
        let i = 0;
        const adminBot = global.GoatBot.config.adminBot
          .filter((item) => !isNaN(item))
          .map((item) => item.toString());
        for (const uid of adminBot) {
          try {
            const userName = await usersData.getName(uid);
            log.master("ADMINBOT", `[${++i}] ${uid} | ${userName}`);
          } catch {
            log.master("ADMINBOT", `[${++i}] ${uid}`);
          }
        }
        log.master("NOTIFICATION", (notification || "").trim());
        log.master("SUCCESS", getText("login", "runBot"));
        log.master("LOAD TIME", `${convertTime(Date.now() - global.GoatBot.startTime)}`);
        logColor("#f5ab00", createLine("COPYRIGHT"));
        console.log(
          `\x1b[1m\x1b[33mCOPYRIGHT:\x1b[0m\x1b[1m\x1b[37m \x1b[0m\x1b[1m\x1b[36mProject GoatBot v2 created by ntkhang03 (https://github.com/ntkhang03), please do not sell this source code or claim it as your own. Thank you!\x1b[0m`
        );
        logColor("#f5ab00", character);
        global.GoatBot.config.adminBot = adminBot;
        writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
        writeFileSync(global.client.dirConfigCommands, JSON.stringify(global.GoatBot.configCommands, null, 2));

        // Listen callback
        const { restartListenMqtt } = global.GoatBot.config;
        let intervalCheckLiveCookieAndRelogin = false;

        async function callBackListen(error, event) {
          if (error) {
            global.statusAccountBot = "can't login";
            if (!isSendNotiErrorMessage) {
              await handlerWhenListenHasError({
                api,
                threadModel,
                userModel,
                globalModel,
                threadsData,
                usersData,
                globalData,
                error,
              });
              isSendNotiErrorMessage = true;
            }
            if (global.GoatBot.config.autoRestartWhenListenMqttError)
              process.exit(2);
            else {
              const keyListen = Object.keys(callbackListenTime).pop();
              if (callbackListenTime[keyListen]) callbackListenTime[keyListen] = () => { };
              let times = 5;
              const spin = createOraDots(getText("login", "retryCheckLiveCookie", times));
              const countTimes = setInterval(() => {
                times--;
                if (times === 0) times = 5;
                spin.text = getText("login", "retryCheckLiveCookie", times);
              }, 1000);

              if (!intervalCheckLiveCookieAndRelogin) {
                intervalCheckLiveCookieAndRelogin = true;
                const interval = setInterval(async () => {
                  clearInterval(interval);
                  clearInterval(countTimes);
                  intervalCheckLiveCookieAndRelogin = false;
                  const keyListen = Date.now();
                  isSendNotiErrorMessage = false;
                  global.GoatBot.Listening = api.listenMqtt(createCallBackListen(keyListen));
                }, 5000);
              }
            }
            return;
          }
          global.statusAccountBot = "good";
          const configLog = global.GoatBot.config.logEvents;
          if (isSendNotiErrorMessage) isSendNotiErrorMessage = false;

          // Whitelist check
          if (
            global.GoatBot.config.whiteListMode?.enable &&
            global.GoatBot.config.whiteListModeThread?.enable &&
            !global.GoatBot.config.adminBot.includes(event.senderID)
          ) {
            if (
              !global.GoatBot.config.whiteListMode.whiteListIds.includes(event.senderID) &&
              !global.GoatBot.config.whiteListModeThread.whiteListThreadIds.includes(event.threadID) &&
              !global.GoatBot.config.adminBot.includes(event.senderID)
            ) return;
          } else if (
            global.GoatBot.config.whiteListMode?.enable &&
            !global.GoatBot.config.whiteListMode.whiteListIds.includes(event.senderID) &&
            !global.GoatBot.config.adminBot.includes(event.senderID)
          ) return;
          else if (
            global.GoatBot.config.whiteListModeThread?.enable &&
            !global.GoatBot.config.whiteListModeThread.whiteListThreadIds.includes(event.threadID) &&
            !global.GoatBot.config.adminBot.includes(event.senderID)
          ) return;

          // ListenMqtt loop check
          if (event.messageID && event.type === "message") {
            if (storage5Message.includes(event.messageID))
              Object.keys(callbackListenTime)
                .slice(0, -1)
                .forEach((key) => { callbackListenTime[key] = () => { }; });
            else storage5Message.push(event.messageID);
            if (storage5Message.length > 5) storage5Message.shift();
          }

          // Log event
          if (!configLog.disableAll && configLog[event.type] !== false) {
            const participantIDs_ = [...(event.participantIDs || [])];
            if (event.participantIDs)
              event.participantIDs = "Array(" + event.participantIDs.length + ")";
            console.log(
              colors.green((event.type || "").toUpperCase() + ":"),
              jsonStringifyColor(event, null, 2)
            );
            if (event.participantIDs) event.participantIDs = participantIDs_;
          }

          const handlerAction = require("../handler/handlerAction.js")(
            api,
            threadModel,
            userModel,
            globalModel,
            usersData,
            threadsData,
            globalData
          );
          handlerAction(event);
        }

        function createCallBackListen(key) {
          key = randomString(10) + (key || Date.now());
          callbackListenTime[key] = callBackListen;
          return function (error, event) {
            callbackListenTime[key](error, event);
          };
        }

        await stopListening();
        global.GoatBot.Listening = api.listenMqtt(createCallBackListen());
        global.GoatBot.callBackListen = callBackListen;

        // Restart listenMqtt
        if (restartListenMqtt.enable) {
          if (restartListenMqtt.logNoti) {
            log.info(
              "LISTEN_MQTT",
              getText("login", "restartListenMessage", convertTime(restartListenMqtt.timeRestart, true))
            );
            log.info("BOT_STARTED", getText("login", "startBotSuccess"));
            logColor("#f5ab00", character);
          }
          const restart = setInterval(async function () {
            if (!restartListenMqtt.enable) {
              clearInterval(restart);
              return log.warn("LISTEN_MQTT", getText("login", "stopRestartListenMessage"));
            }
            try {
              await stopListening();
              await sleep(1000);
              global.GoatBot.Listening = api.listenMqtt(createCallBackListen());
              log.info("LISTEN_MQTT", getText("login", "restartListenMessage2"));
            } catch (e) {
              log.err("LISTEN_MQTT", getText("login", "restartListenMessageError"), e);
            }
          }, restartListenMqtt.timeRestart);
          global.intervalRestartListenMqtt = restart;
        }
      }
    );
  })(appState);

  // Auto relogin when change account
  if (global.GoatBot.config.autoReloginWhenChangeAccount) {
    setTimeout(function () {
      watch(dirAccount, async (type) => {
        if (
          type === "change" &&
          changeFbStateByCode === false &&
          latestChangeContentAccount !== fs.statSync(dirAccount).mtimeMs
        ) {
          clearInterval(global.intervalRestartListenMqtt);
          global.compulsoryStopLisening = true;
          latestChangeContentAccount = fs.statSync(dirAccount).mtimeMs;
          startBot();
        }
      });
    }, 10000);
  }
}

global.GoatBot.reLoginBot = startBot;
startBot();
