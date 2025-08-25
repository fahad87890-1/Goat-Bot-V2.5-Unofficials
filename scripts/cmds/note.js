const axios = require('axios');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

if (!global.GoatBot) {
    global.GoatBot = {
        onReaction: new Map(),
    };
}

module.exports = {
    config: {
        name: 'note',
        aliases: ['n'],
        version: '0.0.1',
        role: 2, // Only bot owners can use this command
        author: 'Niio-team (DC-Nam) & LocDev',
        description: {
            vi: 'Tải lên nội dung file lên server và lấy link chia sẻ hoặc cập nhật nội dung file từ link URL.',
            en: 'Upload file content to the server and get a shareable link, or update file content from a URL link.'
        },
        category: 'Owner',
        guide: {
            vi:
                '  • `{pn} <đường_dẫn_file>`: Tải lên nội dung của file tại `<đường_dẫn_file>` lên server và nhận link Raw/Edit. Sau đó, thả cảm xúc vào tin nhắn để xác nhận upload và ghi đè nội dung file nếu có.\n' +
                '  • `{pn} <đường_dẫn_file> <URL_nguồn>`: Tải nội dung từ `<URL_nguồn>` và ghi đè vào file tại `<đường_dẫn_file>`. Thả cảm xúc để xác nhận.',
            en:
                '  • `{pn} <file_path>`: Uploads the content of the file at `<file_path>` to the server and provides Raw/Edit links. Then, react to the message to confirm the upload and overwrite the file content if any.\n' +
                '  • `{pn} <file_path> <source_URL>`: Downloads content from `<source_URL>` and overwrites the file at `<file_path>`. React to confirm.'
        },
        countDown: 3, // Cooldown in seconds
    },
    onStart: async function (o) {
        const commandName = module.exports.config.name;
        const url = o.event?.messageReply?.args?.[0] || o.args[1];
        let path = `${__dirname}/${o.args[0]}`;
        const send = msg => new Promise(r => o.api.sendMessage(msg, o.event.threadID, (err, res) => r(res), o.event.messageID));

        try {
            if (/^https:\/\//.test(url)) {
                // Scenario: Download content from URL and overwrite local file
                const response = await send(`🔗 File: ${path}\n\nThả cảm xúc để xác nhận thay thế nội dung file`);
                const reactionData = {
                    commandName,
                    path,
                    o,
                    url,
                    action: 'confirm_replace_content',
                };
                global.GoatBot.onReaction.set(response.messageID, reactionData);
            } else {
                // Scenario: Upload local file content to server
                if (!fs.existsSync(path)) {
                    return send(`❎ Đường dẫn file không tồn tại để export`);
                }

                const uuid_raw = uuidv4();
                const url_raw = `https://niio-team.onrender.com/note/${uuid_raw}`;
                const url_redirect = `https://niio-team.onrender.com/note/${uuidv4()}`;

                // Read file content and upload
                const fileContent = fs.readFileSync(path, 'utf8');
                await axios.put(url_raw, fileContent);

                const redirectUrlWithRaw = new URL(url_redirect);
                redirectUrlWithRaw.searchParams.append('raw', uuid_raw);
                await axios.put(redirectUrlWithRaw.href);

                redirectUrlWithRaw.searchParams.delete('raw');

                const response = await send(`📝 Raw: ${redirectUrlWithRaw.href}\n\n✏️ Edit: ${url_raw}\n\n🔗 File: ${path}\n\n📌 Thả cảm xúc để upload code`);
                const reactionData = {
                    commandName,
                    path,
                    o,
                    url: redirectUrlWithRaw.href,
                    action: 'confirm_replace_content',
                };
                global.GoatBot.onReaction.set(response.messageID, reactionData);
            }
        } catch (e) {
            console.error('Error:', e);
            const errorMessage = e.response ? e.response.data : e.toString();
            await send(`❌ Đã xảy ra lỗi: ${errorMessage}`);
        }
    },
    onReaction: async function (o) {
        const reactionData = global.GoatBot.onReaction.get(o.event.messageID);
        const send = msg => new Promise(r => o.api.sendMessage(msg, o.event.threadID, (err, res) => r(res), o.event.messageID));

        try {
            if (!reactionData) {
                console.log("No reaction data found for message ID:", o.event.messageID);
                return;
            }

            if (o.event.userID !== reactionData.o.event.senderID) {
                console.log("Reaction from a different user. Expected:", reactionData.o.event.senderID, "Received:", o.event.userID);
                return;
            }

            switch (reactionData.action) {
                case 'confirm_replace_content': {
                    const data = (await axios.get(reactionData.url, {
                        responseType: 'arraybuffer',
                    })).data;

                    fs.writeFileSync(reactionData.path, data);
                    await send(`✅ Đã upload code thành công\n\n🔗 File: ${reactionData.path}`);
                    global.GoatBot.onReaction.delete(o.event.messageID);
                }
                    break;
                default:
                    console.log("Unknown action:", reactionData.action);
                    break;
            }
        } catch (e) {
            console.error('Error in reaction handling:', e);
            const errorMessage = e.response ? e.response.data : e.toString();
            await send(`❌ Đã xảy ra lỗi khi xử lý phản ứng: ${errorMessage}`);
        }
    }
};