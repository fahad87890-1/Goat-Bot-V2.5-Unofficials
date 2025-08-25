const fs = require('fs-extra');
const path = require('path');

// --- CẤU HÌNH MODULE ---
module.exports.config = {
    name: "clean",
    version: "1.0.0",
    author: "Marrcus (Cải tiến bởi Gemini)",
    role: 2, // Chỉ Admin bot mới có thể dùng
    description: {
        vi: "Dọn dẹp các file rác trong thư mục cache của bot để giải phóng dung lượng.",
        en: "Cleans junk files from the bot's cache directory to free up space."
    },
    category: "Admin",
    guide: {
        vi: 
            "   • `clean`: Bắt đầu quá trình dọn dẹp cache.\n" +
            "   • Bot sẽ hỏi bạn muốn dọn dẹp tự động (toàn bộ các loại file phổ biến) hay tùy chọn.\n" +
            "      - Trả lời 'Y' để dọn dẹp tự động.\n" +
            "      - Trả lời 'N' để dọn dẹp tùy chọn.\n" +
            "   • Nếu chọn 'N', bot sẽ yêu cầu bạn nhập các đuôi file cần xóa (ví dụ: mp3 jpg png).",
        en: 
            "   • `clean`: Starts the cache cleaning process.\n" +
            "   • The bot will ask if you want an automatic or custom cleanup.\n" +
            "      - Reply 'Y' for automatic cleanup.\n" +
            "      - Reply 'N' for custom cleanup.\n" +
            "   • If you choose 'N', the bot will ask you to enter the file extensions to delete (e.g., mp3 jpg png)."
    },
    countdown: 5,
};

// --- HÀM TIỆN ÍCH ---

/**
 * Hàm dọn dẹp cache dựa trên danh sách các đuôi file.
 * @param {string[]} extensions - Mảng các đuôi file cần xóa (vd: ['png', 'jpg']).
 * @returns {Promise<{deletedCount: number, errorCount: number}>} - Số file đã xóa và số file lỗi.
 */
async function cleanCache(extensions) {
    const cachePath = path.join(__dirname, '..', '..', 'caches'); // Đường dẫn an toàn đến thư mục caches
    let deletedCount = 0;
    let errorCount = 0;

    try {
        if (!fs.existsSync(cachePath)) {
            console.log(`[CLEAN] Cache directory not found, creating one.`);
            fs.mkdirSync(cachePath, { recursive: true });
            return { deletedCount: 0, errorCount: 0 };
        }

        const files = await fs.readdir(cachePath);
        const lowerCaseExtensions = extensions.map(ext => ext.toLowerCase());

        const filesToDelete = files.filter(file => {
            const fileExt = path.extname(file).slice(1).toLowerCase();
            return lowerCaseExtensions.includes(fileExt);
        });

        if (filesToDelete.length === 0) {
            return { deletedCount: 0, errorCount: 0 };
        }

        for (const file of filesToDelete) {
            try {
                await fs.unlink(path.join(cachePath, file));
                deletedCount++;
            } catch (err) {
                console.error(`[CLEAN] Error deleting file ${file}:`, err);
                errorCount++;
            }
        }
        return { deletedCount, errorCount };
    } catch (err) {
        console.error(`[CLEAN] Error reading cache directory:`, err);
        return { deletedCount: 0, errorCount: 1 }; // Lỗi đọc thư mục
    }
}

// --- HÀM CHÍNH ---
module.exports.onStart = async function({ api, event, commandName }) {
    // Chỉ admin bot mới có quyền thực thi
    if (!global.config.ADMINBOT.includes(event.senderID)) {
        return api.sendMessage("❎ Bạn không có quyền sử dụng lệnh này.", event.threadID, event.messageID);
    }

    return api.sendMessage(
        "🗑️ Bạn muốn dọn dẹp cache tự động (toàn bộ) hay tùy chọn loại file?\n\n" +
        "👉 Trả lời 'Y' để dọn dẹp tự động.\n" +
        "👉 Trả lời 'N' để chọn loại file cần xóa.",
        event.threadID,
        (err, info) => {
            if (err) return console.error(err);
            global.GoatBot.onReply.set(info.messageID, {
                commandName,
                author: event.senderID,
                messageID: info.messageID,
                step: 'initial_choice' // Bước 1: Lựa chọn Y/N
            });
        },
        event.messageID
    );
};

module.exports.onReply = async function({ api, event, Reply, commandName }) {
    const { author, messageID, step } = Reply;

    // Chỉ người dùng ban đầu mới có thể trả lời
    if (event.senderID !== author) {
        return api.sendMessage("⚠️ Chỉ người đã gọi lệnh mới có thể trả lời.", event.threadID, event.messageID);
    }
    
    // Gỡ tin nhắn hỏi của bot
    api.unsendMessage(messageID);

    // Xử lý bước 1: Chọn Y/N
    if (step === 'initial_choice') {
        const choice = event.body.toLowerCase();
        
        switch (choice) {
            case 'y':
            case 'yes': {
                api.sendMessage("⏳ Bắt đầu dọn dẹp tự động...", event.threadID, event.messageID);
                const defaultTypes = ["png", "jpg", "mp4", "jpeg", "gif", "m4a", "txt", "mp3", "wav", "json", "miraix", "heic", "mov", "pdf"];
                const result = await cleanCache(defaultTypes);
                
                return api.sendMessage(
                    `✅ Dọn dẹp hoàn tất!\n" +
                    "   - Đã xóa: ${result.deletedCount} file.\n" +
                    "   - Lỗi: ${result.errorCount} file.`,
                    event.threadID,
                    event.messageID
                );
            }

            case 'n':
            case 'no': {
                return api.sendMessage(
                    "📌 Vui lòng reply tin nhắn này với các loại file bạn muốn xóa, cách nhau bởi dấu cách.\n\n" +
                    "Ví dụ: mp3 mp4 jpg",
                    event.threadID,
                    (err, info) => {
                        if (err) return console.error(err);
                        global.GoatBot.onReply.set(info.messageID, {
                            commandName,
                            author: event.senderID,
                            messageID: info.messageID,
                            step: 'custom_choice' // Bước 2: Nhập loại file tùy chọn
                        });
                    },
                    event.messageID
                );
            }

            default: {
                return api.sendMessage("⚠️ Lựa chọn không hợp lệ. Vui lòng trả lời 'Y' hoặc 'N'.", event.threadID, event.messageID);
            }
        }
    }

    // Xử lý bước 2: Nhận loại file tùy chọn
    if (step === 'custom_choice') {
        const customTypes = event.body.toLowerCase().split(' ').filter(type => type.trim() !== '');
        
        if (customTypes.length === 0) {
            return api.sendMessage("⚠️ Bạn chưa nhập loại file nào. Vui lòng thử lại.", event.threadID, event.messageID);
        }

        api.sendMessage(`⏳ Bắt đầu dọn dẹp các file có đuôi: ${customTypes.join(', ')}...`, event.threadID, event.messageID);
        const result = await cleanCache(customTypes);

        return api.sendMessage(
            `✅ Dọn dẹp hoàn tất!\n" +
            "   - Đã xóa: ${result.deletedCount} file.\n" +
            "   - Lỗi: ${result.errorCount} file.`,
            event.threadID,
            event.messageID
        );
    }
};