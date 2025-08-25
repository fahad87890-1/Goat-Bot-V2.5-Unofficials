const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "del",
    aliases: ["delete", "deletecmd", "rm", "rmcmd"],
    version: "1.2.0",
    author: "LocDev, refined by Cursor",
    countDown: 5,
    role: 2,
    description: {
      vi: "Gỡ tải và xóa vĩnh viễn một tệp lệnh khỏi thư mục cmds",
      en: "Unload and permanently delete a command file from cmds"
    },
    category: "owner",
    guide: {
      vi: "   {pn} <tên lệnh | tên file .js>\n   Ví dụ: {pn} ping hoặc {pn} ping.js",
      en: "   {pn} <command name | file name .js>\n   Example: {pn} ping or {pn} ping.js"
    }
  },

  langs: {
    vi: {
      missingName: "⚠️ | Vui lòng nhập tên lệnh hoặc tên file .js",
      cannotDeleteSelf: "❌ | Không thể xóa chính lệnh này.",
      invalidFileName: "⚠️ | Tên tệp không hợp lệ",
      fileNotFound: "⚠️ | Không tìm thấy tệp lệnh \"%1\"",
      blockedOutside: "⚠️ | Không được phép xóa ngoài thư mục lệnh",
      confirm: "❓ | Bạn có chắc muốn xóa vĩnh viễn tệp \"%1\"?\n👉 Reply 'Y' để xác nhận.",
      cancelled: "✅ | Đã hủy.",
      unloaded: "✅ | Đã unload lệnh \"%1\"",
      deleted: "✅ | Đã xóa tệp \"%1\" thành công",
      deletedAndUnloaded: "✅ | Đã unload và xóa tệp \"%1\" thành công",
      errorUnlink: "❌ | Không thể xóa tệp \"%1\": %2"
    },
    en: {
      missingName: "⚠️ | Please enter a command name or file name .js",
      cannotDeleteSelf: "❌ | Cannot delete this command itself.",
      invalidFileName: "⚠️ | Invalid file name",
      fileNotFound: "⚠️ | Command file \"%1\" not found",
      blockedOutside: "⚠️ | Deleting outside the commands directory is not allowed",
      confirm: "❓ | Are you sure to permanently delete \"%1\"?\n👉 Reply 'Y' to confirm.",
      cancelled: "✅ | Cancelled.",
      unloaded: "✅ | Unloaded command \"%1\"",
      deleted: "✅ | Deleted file \"%1\" successfully",
      deletedAndUnloaded: "✅ | Unloaded and deleted file \"%1\" successfully",
      errorUnlink: "❌ | Could not delete \"%1\": %2"
    }
  },

  onStart: async function ({ args, message, event, getLang, commandName }) {
    const input = (args[0] || "").trim();
    if (!input)
      return message.reply(getLang("missingName"));

    const rawName = input.toLowerCase().endsWith(".js") ? input.slice(0, -3) : input;
    const selfBlocked = new Set([commandName, "delete", "deletecmd", "rm", "rmcmd", "d"]);
    if (selfBlocked.has(rawName.toLowerCase()))
      return message.reply(getLang("cannotDeleteSelf"));

    const cmdsDir = path.normalize(path.join(process.cwd(), "scripts", "cmds"));
    const resolvedCmdsDir = path.resolve(cmdsDir);

    let baseName = rawName;
    let targetPath;

    // Try resolve by loaded command name or alias
    const loaded = global.GoatBot.commands.get(rawName) || global.GoatBot.commands.get(global.GoatBot.aliases.get(rawName));
    if (loaded?.location) {
      const loc = path.resolve(loaded.location);
      if (loc.startsWith(resolvedCmdsDir + path.sep)) {
        baseName = path.basename(loc, ".js");
        targetPath = loc;
      }
    }

    // Fallback to file path in cmds dir
    if (!targetPath)
      targetPath = path.resolve(cmdsDir, `${baseName}.js`);

    // Basic filename validation (avoid path traversal)
    const validName = /^[\w\-]+$/i.test(baseName);
    if (!validName)
      return message.reply(getLang("invalidFileName"));

    if (!targetPath.startsWith(resolvedCmdsDir + path.sep))
      return message.reply(getLang("blockedOutside"));

    if (!fs.existsSync(targetPath))
      return message.reply(getLang("fileNotFound", `${baseName}.js`));

    // Ask for confirmation
    return message.reply(getLang("confirm", `${baseName}.js`), (err, info) => {
      if (err) return;
      global.GoatBot.onReply.set(info.messageID, {
        commandName,
        author: event.senderID,
        messageID: info.messageID,
        data: { baseName, targetPath }
      });
    });
  },

  onReply: async function ({ Reply, event, message, getLang }) {
    if (event.senderID != Reply.author)
      return;
    const answer = (event.body || "").trim().toLowerCase();
    if (!["y", "yes"].includes(answer))
      return message.reply(getLang("cancelled"));

    const { baseName, targetPath } = Reply.data;
    const { unloadScripts } = global.utils;

    try {
      // Try unload first if still loaded
      try {
        unloadScripts("cmds", baseName, global.GoatBot.configCommands, getLang);
      } catch (_) {}

      await fs.remove(targetPath);
      return message.reply(getLang("deletedAndUnloaded", `${baseName}.js`));
    } catch (err) {
      return message.reply(getLang("errorUnlink", `${baseName}.js`, err.message));
    }
  }
};