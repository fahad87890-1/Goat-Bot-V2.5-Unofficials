const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "file",
    version: "4.0.0",
    author: "vtuan",
    countDown: 0,
    role: 2,
    description: {
      vi: "Duyệt/xóa thư mục nhanh trong thư mục bot",
      en: "Quickly browse/delete files inside the bot directory"
    },
    category: "owner",
    guide: {
      vi: "   {pn} [đường dẫn]\n   Reply: open <số> để mở; del <số...> để xóa",
      en: "   {pn} [path]\n   Reply: open <index> to open; del <index...> to delete"
    }
  },

  langs: {
    vi: {
      pathNotExist: "❎ Đường dẫn không tồn tại hoặc không phải thư mục!",
      cannotReadDir: "❎ Không thể đọc thư mục!",
      emptyDir: "📂 Thư mục trống.",
      footer: "📦 Tổng: %1\n👉 Reply: open <số> để mở; del <số...> để xóa",
      invalidIndex: "❎ Số không hợp lệ.",
      notDirectory: "❎ Đây không phải là thư mục!",
      missingIndex: "❎ Vui lòng nhập số.",
      deletedList: "🧹 Đã xử lý:\n%1",
      unknownCmd: "❎ Cú pháp: open <số> | del <số...>"
    },
    en: {
      pathNotExist: "❎ Path does not exist or is not a directory!",
      cannotReadDir: "❎ Cannot read directory!",
      emptyDir: "📂 Empty directory.",
      footer: "📦 Total: %1\n👉 Reply: open <index> to open; del <index...> to delete",
      invalidIndex: "❎ Invalid index.",
      notDirectory: "❎ Not a directory!",
      missingIndex: "❎ Please provide index(es).",
      deletedList: "🧹 Processed:\n%1",
      unknownCmd: "❎ Usage: open <index> | del <index...>"
    }
  },

  onStart: async function ({ args, message, event, getLang, commandName }) {
    const baseDir = process.cwd();
    const inputPath = args[0] || ".";
    const resolved = path.isAbsolute(inputPath)
      ? path.resolve(inputPath)
      : path.resolve(path.join(baseDir, inputPath));

    // prevent going outside bot directory
    const dir = resolved.startsWith(baseDir + path.sep) ? resolved : baseDir;

    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory())
      return message.reply(getLang("pathNotExist"));

    const dirs = [];
    const files = [];
    let total = 0;

    try {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name);
        const isDir = ent.isDirectory();
        let size = 0;
        if (!isDir) {
          try { size = fs.statSync(full).size; } catch { size = 0; }
        }
        else {
          size = getDirSize(full);
        }
        total += size;
        (isDir ? dirs : files).push({ name: ent.name, path: full, isDir, size });
      }
    } catch (e) {
      return message.reply(getLang("cannotReadDir"));
    }

    const list = [...dirs.sort(sortName), ...files.sort(sortName)];
    if (list.length === 0)
      return message.reply(getLang("emptyDir"));

    const msg = list.map((f, i) =>
      `${i + 1}. ${f.isDir ? "📁" : "📄"} ${f.name} (${formatBytes(f.size)})`
    ).join("\n") + `\n\n` + getLang("footer", formatBytes(total));

    return message.reply(msg, (err, info) => {
      if (err) return;
      global.GoatBot.onReply.set(info.messageID, {
        commandName,
        author: event.senderID,
        messageID: info.messageID,
        data: { dir, list }
      });
    });
  },

  onReply: async function ({ Reply, event, message, getLang }) {
    if (event.senderID != Reply.author)
      return;

    const body = (event.body || "").trim();
    const [rawCmd, ...rest] = body.split(/\s+/);
    if (!rawCmd)
      return;
    const cmd = rawCmd.toLowerCase();
    const list = Reply.data.list || [];

    if (cmd === "open" || cmd === "o") {
      const idx = parseInt(rest[0], 10);
      if (!idx || idx < 1 || idx > list.length)
        return message.reply(getLang("invalidIndex"));
      const target = list[idx - 1];
      if (!target?.isDir)
        return message.reply(getLang("notDirectory"));
      return module.exports.onStart({ args: [target.path], message, event, getLang, commandName: Reply.commandName });
    }

    if (["del", "rm", "delete"].includes(cmd)) {
      if (rest.length === 0)
        return message.reply(getLang("missingIndex"));
      const results = [];
      for (const token of rest) {
        const idx = parseInt(token, 10);
        if (!idx || idx < 1 || idx > list.length)
          continue;
        const f = list[idx - 1];
        try {
          await fs.remove(f.path);
          results.push(`✔ ${f.name}`);
        } catch {
          results.push(`⚠ ${f.name}`);
        }
      }
      return message.reply(getLang("deletedList", results.join("\n")));
    }

    return message.reply(getLang("unknownCmd"));
  }
};

function getDirSize(root) {
  let size = 0;
  const stack = [root];
  while (stack.length) {
    const currentDir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(currentDir, e.name);
      try {
        if (e.isDirectory()) stack.push(full);
        else size += fs.statSync(full).size;
      } catch {}
    }
  }
  return size;
}

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"]; 
  if (!bytes || bytes <= 0) return `0 ${units[0]}`;
  const i = Math.floor(Math.log2(bytes) / 10);
  return (bytes / 1024 ** i).toFixed(1) + " " + units[i];
}

function sortName(a, b) { return a.name.localeCompare(b.name); }
