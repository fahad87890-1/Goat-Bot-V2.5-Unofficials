module.exports.config = {
    name: "contact",
    version: "1.0.1",
    role: 0,
    author: "DongDev (Cải tiến bởi Gemini)",
    description: {
        vi: "Chia sẻ liên hệ (contact card) của người dùng Facebook trong nhóm.",
        en: "Shares a user's Facebook contact card in the group."
    },
    category: "Tiện ích",
    guide: {
        vi:
            "Sử dụng lệnh theo các cách sau:\n" +
            "   • `contact`: Tự động chia sẻ liên hệ của chính bạn.\n" +
            "   • `contact [@tag]`: Chia sẻ liên hệ của người bạn tag.\n" +
            "   • `contact [userID]`: Chia sẻ liên hệ của người dùng có ID đó.\n" +
            "   • `contact [link_profile]`: Chia sẻ liên hệ của người dùng có link profile đó.\n" +
            "   • Reply (phản hồi) một tin nhắn và gõ `contact`: Chia sẻ liên hệ của người gửi tin nhắn đó.",
        en:
            "Usage:\n" +
            "   • `contact`: Automatically shares your own contact.\n" +
            "   • `contact [@tag]`: Shares the contact of the tagged person.\n" +
            "   • `contact [userID]`: Shares the contact of the user with that ID.\n" +
            "   • `contact [profile_link]`: Shares the contact of the user with that profile link.\n" +
            "   • Reply to a message and type `contact`: Shares the contact of the message's sender."
    },
    cooldowns: 5
};

module.exports.onStart = async function({ api, event, args }) {
    const { shareContact } = api;
    const { threadID, messageReply, senderID, mentions, type } = event;

    try {
        let targetID;

        // Ưu tiên 1: Reply tin nhắn
        if (type === "message_reply" && messageReply) {
            targetID = messageReply.senderID;
        }
        // Ưu tiên 2: Tag thành viên
        else if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
        }
        // Ưu tiên 3: Dùng đối số (ID hoặc link)
        else if (args.length > 0) {
            const input = args[0];
            // Nếu đối số không phải là số (có thể là link)
            if (isNaN(input)) {
                targetID = await global.utils.getUID(input);
            } 
            // Nếu đối số là số (chắc chắn là ID)
            else {
                targetID = input;
            }
        }
        // Mặc định: Dùng ID của người gửi lệnh
        else {
            targetID = senderID;
        }

        // Kiểm tra nếu không tìm được ID
        if (!targetID) {
            return api.sendMessage("❌ Không thể xác định người dùng. Vui lòng thử lại.", threadID, event.messageID);
        }

        // Thực hiện chia sẻ contact
        await shareContact("", targetID, threadID);

    } catch (error) {
        console.error("Lỗi ở lệnh 'contact':", error);
        api.sendMessage("❌ Đã xảy ra lỗi. Không thể chia sẻ liên hệ, có thể do ID hoặc link không hợp lệ.", threadID, event.messageID);
    }
};