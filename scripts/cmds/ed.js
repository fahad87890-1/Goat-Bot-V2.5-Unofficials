module.exports = {
  config: {
    name: 'edit',
    aliases: ['ed'],
    version: '1.0.0',
    role: 0,
    author: 'DC-Nam',
    shortDescription: 'Edit bot message',
    longDescription: 'Edit a message sent by the bot',
    category: 'Tiện ích',
    guide: '{pn} <text>',
    countDown: 5
  },

  onStart: async function ({ event, args, api }) {
    const { messageReply } = event;
    // Chỉ cho phép sửa tin nhắn của bot
    if (!messageReply || messageReply.senderID !== api.getCurrentUserID()) {
      return api.sendMessage('Bạn chỉ có thể sửa tin nhắn của bot!', event.threadID, event.messageID);
    }
    const newText = args.join(' ');
    if (!newText) {
      return api.sendMessage('Vui lòng nhập nội dung mới để sửa!', event.threadID, event.messageID);
    }
    try {
      await api.editMessage(newText, messageReply.messageID);
    } catch (err) {
      api.sendMessage('Không thể sửa tin nhắn. Bot hoặc API không hỗ trợ.', event.threadID, event.messageID);
    }
  }
};