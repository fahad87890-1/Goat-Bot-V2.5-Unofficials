/**
 * @author NTKhang
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 * ! If you do not download the source code from the above address, you are using an unknown version and at risk of having your account hacked
 *
 * English:
 * ! Please do not change the below code, it is very important for the project.
 * It is my motivation to maintain and develop the project for free.
 * ! If you change it, you will be banned forever
 * Thank you for using
 *
 * Vietnamese:
 * ! Vui lòng không thay đổi mã bên dưới, nó rất quan trọng đối với dự án.
 * Nó là động lực để tôi duy trì và phát triển dự án miễn phí.
 * ! Nếu thay đổi nó, bạn sẽ bị cấm vĩnh viễn
 * Cảm ơn bạn đã sử dụng
 */

process.on('unhandledRejection', error => console.log(error));
process.on('uncaughtException', error => console.log(error));

const fs = require("fs-extra");
const path = require("path");
const log = require('./logger/log.js');

process.env.BLUEBIRD_W_FORGOTTEN_RETURN = 0;

const { NODE_ENV } = process.env;
const dirConfig = path.normalize(`${__dirname}/config${['production', 'development'].includes(NODE_ENV) ? '.dev.json' : '.json'}`);
const dirConfigCommands = path.normalize(`${__dirname}/configCommands${['production', 'development'].includes(NODE_ENV) ? '.dev.json' : '.json'}`);
const dirAccount = path.normalize(`${__dirname}/account${['production', 'development'].includes(NODE_ENV) ? '.dev.txt' : '.txt'}`);

function validJSON(pathDir) {
    try {
        if (!fs.existsSync(pathDir))
            throw new Error(`File "${pathDir}" not found`);
        JSON.parse(fs.readFileSync(pathDir, 'utf-8'));
        return true;
    }
    catch (err) {
        throw new Error(`Invalid JSON in "${pathDir}": ${err.message}`);
    }
}

for (const pathDir of [dirConfig, dirConfigCommands]) {
    try {
        validJSON(pathDir);
    } catch (err) {
        log.error("CONFIG", `Invalid JSON file "${pathDir.replace(__dirname, "")}":\n${err.message}\nPlease fix it and restart bot`);
        process.exit(0);
    }
}

const config = require(dirConfig);
if (config.whiteListMode?.whiteListIds && Array.isArray(config.whiteListMode.whiteListIds))
    config.whiteListMode.whiteListIds = config.whiteListMode.whiteListIds.map(id => id.toString());
const configCommands = require(dirConfigCommands);

global.GoatBot = {
    startTime: Date.now() - process.uptime() * 1000,
    commands: new Map(),
    eventCommands: new Map(),
    commandFilesPath: [],
    eventCommandsFilesPath: [],
    aliases: new Map(),
    onFirstChat: [],
    onChat: [],
    onEvent: [],
    onReply: new Map(),
    onReaction: new Map(),
    onAnyEvent: [],
    config,
    configCommands,
    envCommands: {},
    envEvents: {},
    envGlobal: {},
    reLoginBot: function () { },
    Listening: null,
    oldListening: [],
    callbackListenTime: {},
    storage5Message: [],
    fcaApi: null,
    botID: null
};

global.db = {
    allThreadData: [],
    allUserData: [],
    allDashBoardData: [],
    allGlobalData: [],
    threadModel: null,
    userModel: null,
    dashboardModel: null,
    globalModel: null,
    threadsData: null,
    usersData: null,
    globalData: null,
    receivedTheFirstMessage: {}
};

global.client = {
    dirConfig,
    dirConfigCommands,
    dirAccount,
    countDown: {},
    cache: {},
    database: {
        creatingThreadData: [],
        creatingUserData: [],
        creatingDashBoardData: [],
        creatingGlobalData: []
    },
    commandBanned: configCommands.commandBanned
};

const utils = require("./utils.js");
global.utils = utils;

global.temp = {
    createThreadData: [],
    createUserData: [],
    createThreadDataError: [],
    filesOfGoogleDrive: {
        arraybuffer: {},
        stream: {},
        fileNames: {}
    },
    contentScripts: {
        cmds: {},
        events: {}
    }
};

// Watch config files and reload if changed
const watchAndReloadConfig = (dir, type, prop, logName) => {
    let lastModified = fs.statSync(dir).mtimeMs;
    let isFirstModified = true;
    fs.watch(dir, (eventType) => {
        if (eventType === type) {
            const oldConfig = global.GoatBot[prop];
            setTimeout(() => {
                try {
                    if (isFirstModified) {
                        isFirstModified = false;
                        return;
                    }
                    if (lastModified === fs.statSync(dir).mtimeMs) return;
                    global.GoatBot[prop] = JSON.parse(fs.readFileSync(dir, 'utf-8'));
                    log.success(logName, `Reloaded ${dir.replace(process.cwd(), "")}`);
                } catch (err) {
                    log.warn(logName, `Can't reload ${dir.replace(process.cwd(), "")}`);
                    global.GoatBot[prop] = oldConfig;
                } finally {
                    lastModified = fs.statSync(dir).mtimeMs;
                }
            }, 200);
        }
    });
};

watchAndReloadConfig(dirConfigCommands, 'change', 'configCommands', 'CONFIG COMMANDS');
watchAndReloadConfig(dirConfig, 'change', 'config', 'CONFIG');

global.GoatBot.envGlobal = global.GoatBot.configCommands.envGlobal;
global.GoatBot.envCommands = global.GoatBot.configCommands.envCommands;
global.GoatBot.envEvents = global.GoatBot.configCommands.envEvents;

const getText = global.utils.getText;

// Auto restart
if (config.autoRestart) {
    const time = config.autoRestart.time;
    if (!isNaN(time) && time > 0) {
        utils.log.info("AUTO RESTART", getText("Goat", "autoRestart1", utils.convertTime(time, true)));
        setTimeout(() => {
            utils.log.info("AUTO RESTART", "Restarting...");
            process.exit(2);
        }, time);
    }
}

(async () => {
    require(`./bot/login/login${NODE_ENV === 'development' ? '.dev.js' : '.js'}`);
})();
