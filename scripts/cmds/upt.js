const fs = require('fs').promises;
const os = require('os');
const moment = require('moment-timezone');
const nodeDiskInfo = require('node-disk-info');

module.exports = {
    config: {
        name: "upt",
        version: "0.0.3",
        author: "LocDev",
        countDown: 5,
        role: 0,
        description: {
            en: "Displays detailed system uptime and resource usage information of the bot's host.",
            vi: "Hiển thị thông tin chi tiết về thời gian hoạt động của hệ thống và mức sử dụng tài nguyên của máy chủ bot."
        },
        category: "System",
        guide: {
            en: "{pn} - To view system information.",
            vi: "{pn} - Để xem thông tin hệ thống."
        }
    },

    langs: {
        en: {
            currentTime: "Current Time",
            botUptime: "Bot Uptime",
            nodePackages: "Node Packages",
            botStatus: "Bot Status",
            os: "Operating System",
            cpu: "CPU",
            ramUsage: "RAM Usage",
            freeRam: "Free RAM",
            storageUsage: "Storage Usage",
            freeStorage: "Free Storage",
            ping: "Ping",
            requestedBy: "Requested by",
            smooth: "smooth",
            average: "average",
            slow: "slow",
            unknown: "Unknown",
            errorReadingPackage: "Error reading package.json:",
            errorFetchingInfo: "An error occurred while fetching system information:",
            na: "N/A"
        },
        vi: {
            currentTime: "Thời gian hiện tại",
            botUptime: "Thời gian hoạt động của bot",
            nodePackages: "Số lượng gói Node",
            botStatus: "Trạng thái bot",
            os: "Hệ điều hành",
            cpu: "CPU",
            ramUsage: "Sử dụng RAM",
            freeRam: "RAM trống",
            storageUsage: "Sử dụng bộ nhớ",
            freeStorage: "Bộ nhớ trống",
            ping: "Độ trễ (Ping)",
            requestedBy: "Yêu cầu bởi",
            smooth: "mượt mà",
            average: "trung bình",
            slow: "chậm",
            unknown: "Không xác định",
            errorReadingPackage: "Lỗi khi đọc package.json:",
            errorFetchingInfo: "Đã xảy ra lỗi khi lấy thông tin hệ thống:",
            na: "Không có"
        }
    },

    onStart: async function ({ api, event, lang }) {
        const _ = this.langs[lang] || this.langs.en;
        const startTime = Date.now();

        // Helper functions
        const getDependencyCount = async () => {
            try {
                const content = await fs.readFile('package.json', 'utf8');
                const data = JSON.parse(content);
                return (Object.keys(data.dependencies || {}).length +
                        Object.keys(data.devDependencies || {}).length);
            } catch (err) {
                console.error(`${_.errorReadingPackage}`, err);
                return -1;
            }
        };

        const getStatusByPing = (ping) => {
            if (ping < 200) return _.smooth;
            if (ping < 800) return _.average;
            return _.slow;
        };

        const getPrimaryIP = () => {
            const interfaces = os.networkInterfaces();
            for (const iface of Object.values(interfaces)) {
                for (const alias of iface || []) {
                    if (alias.family === 'IPv4' && !alias.internal) return alias.address;
                }
            }
            return '127.0.0.1';
        };

        const formatUptime = (seconds) => {
            const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
            const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
            const s = Math.floor(seconds % 60).toString().padStart(2, '0');
            return `${h}:${m}:${s}`;
        };

        const convertToGB = (bytes) =>
            typeof bytes !== 'number' || isNaN(bytes) ? _.na : `${(bytes / 1024 ** 3).toFixed(2)}GB`;

        try {
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;

            const currentUptime = formatUptime(process.uptime());
            const dependencyCount = await getDependencyCount();
            const pingReal = Date.now() - startTime;
            const botStatus = getStatusByPing(pingReal);
            const ip = getPrimaryIP(); // Optional use

            const disks = await nodeDiskInfo.getDiskInfo();
            const disk = disks[0] || { blocks: 0, available: 0, used: 0 };

            const userInfo = await api.getUserInfo(event.senderID);
            const userName = userInfo[event.senderID]?.name || 'User';

            const now = moment().tz('Asia/Ho_Chi_Minh');

            const reply = `
🌐 **${_.os}**
───
⏰ ${_.currentTime}: ${now.format('HH:mm:ss')} | ${now.format('DD/MM/YYYY')}
⏱️ ${_.botUptime}: ${currentUptime}
🗂️ ${_.nodePackages}: ${dependencyCount >= 0 ? dependencyCount : _.unknown}
🔣 ${_.botStatus}: ${botStatus}
📋 ${_.os}: ${os.type()} ${os.release()} (${os.arch()})
💾 ${_.cpu}: ${os.cpus().length} core(s) - ${os.cpus()[0].model} @ ${Math.round(os.cpus()[0].speed)}MHz
📊 ${_.ramUsage}: ${convertToGB(usedMem)} / ${convertToGB(totalMem)}
🛢️ ${_.freeRam}: ${convertToGB(freeMem)}
🗄️ ${_.storageUsage}: ${convertToGB(disk.used)} / ${convertToGB(disk.blocks)}
📑 ${_.freeStorage}: ${convertToGB(disk.available)}
🛜 ${_.ping}: ${pingReal}ms
👤 ${_.requestedBy}: ${userName}
───`.trim();

            await api.sendMessage(reply, event.threadID, event.messageID);
        } catch (err) {
            console.error(`${_.errorFetchingInfo}`, err.message);
            api.sendMessage(`❎ ${_.errorFetchingInfo} ${err.message}`, event.threadID, event.messageID);
        }
    }
};
