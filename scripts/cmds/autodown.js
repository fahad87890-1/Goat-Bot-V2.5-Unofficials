const axios = require("axios");
const streamUrl = require("../../utils/streamUrl");

module.exports = {
  config: {
    name: "autodown",
    version: "0.0.3",
    author: "LocDev (refactor by ChatGPT)",
    countDown: 5,
    role: 0,
    description: {
      vi: "Tự động tải video/ảnh từ các nền tảng",
      en: "Automatically download videos/images from various platforms"
    },
    category: "utility"
  },

  langs: {
    vi: {
      no_valid_media: "⚠️ Không tìm thấy nội dung media hợp lệ."
    },
    en: {
      no_valid_media: "⚠️ No valid media content found."
    }
  },

  onStart: async function () { },

  onChat: async function ({ api, event, getLang }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const match = body.match(/https?:\/\/[^\s]+/g);
    if (!match) return;

    const url = match[0].replace(/[^\w\d:\/?&=%.~-]/g, "");
    const supported = [
      "v.douyin.com",
      "instagram.com",
      "threads.net",
      "threads.com",
      "capcut.com",
      "x.com",
      "twitter.com",
      "tiktok.com",
      "facebook.com",
      "youtube.com",
      "youtu.be"
    ];
    if (!supported.some(domain => url.includes(domain))) return;

    try {
      const { data: payload } = await axios.post(
        'https://downr.org/.netlify/functions/download',
        { url },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0',
            'Origin': 'https://downr.org',
            'Referer': 'https://downr.org/'
          }
        }
      );

      const result = payload?.result || payload?.data || payload || {};
      const { author, title, source } = result;
      const medias = result.medias || result.media || result.links || [];
      if (!Array.isArray(medias) || medias.length === 0)
        return api.sendMessage(getLang("no_valid_media"), threadID, null, messageID);

      const header = `[${(source || "unknown").toUpperCase()}] - Tự Động Tải`;
      const info = `👤 Tác giả: ${author || "Không rõ"}\n💬 Tiêu đề: ${title || "Không rõ"}`;

      const firstMedia = medias[0];
      if (firstMedia.type === "image") {
        const results = await Promise.allSettled(
          medias.filter(m => m.type === "image" && m.url).map(m => streamUrl(m.url))
        );
        const attachments = results
          .filter(r => r.status === "fulfilled" && r.value)
          .map(r => r.value);
        if (!attachments.length) return;
        await api.sendMessage({ body: `${header}\n\n${info}`, attachment: attachments }, threadID, null, messageID);
        return;
      }

      const stream = await streamUrl(firstMedia.url);
      await api.sendMessage({ body: `${header}\n\n${info}`, attachment: stream }, threadID, null, messageID);
    } catch (err) {
      // silently ignore errors to avoid spam
    }
  }
};