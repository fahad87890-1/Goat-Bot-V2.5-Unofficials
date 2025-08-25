const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

module.exports = (api, threadModel, userModel, globalModel, usersData, threadsData, globalData) => {
	const handlerEvents = require(process.env.NODE_ENV == 'development' ? "./handlerEvents.dev.js" : "./handlerEvents.js")(api, threadModel, userModel, globalModel, usersData, threadsData, globalData);

	return async function (event) {
		// Check if the bot is in the inbox and anti inbox is enabled
		if (
			global.GoatBot.config.antiInbox == true &&
			(event.senderID == event.threadID || event.userID == event.senderID || event.isGroup == false) &&
			(event.senderID || event.userID || event.isGroup == false)
		)
			return;

		const message = createFuncMessage(api, event);

		await handlerCheckDB(usersData, threadsData, event);
		const handlerChat = await handlerEvents(event, message);
		if (!handlerChat)
			return;

		// Log self events and typing/presence toggles
		try {
			const fcaCfg = (global.GoatBot && global.GoatBot.config && global.GoatBot.config.optionsFca) || {};
			if (event.isTyping && fcaCfg.listenTyping) {
				global.utils.log.info('LISTEN_TYPING', global.utils.jsonStringifyColor({ from: event.from, to: event.threadID, isTyping: !!(event.isTyping || event.st) }, null, 2));
			}
			if (typeof event.isTyping === 'boolean' && fcaCfg.listenTyping) {
				// ensure at least one log when typ event routed
			}
			if ((event.senderID === global.GoatBot.botID || event.author === global.GoatBot.botID) && (fcaCfg.selfListen || fcaCfg.selfListenEvent)) {
				global.utils.log.info('SELF_EVENT', global.utils.jsonStringifyColor({ type: event.type, threadID: event.threadID, messageID: event.messageID }, null, 2));
			}
		} catch (_) {}

		const {
			onAnyEvent, onFirstChat, onStart, onChat,
			onReply, onEvent, handlerEvent, onReaction,
			typ, presence, read_receipt
		} = handlerChat;


		onAnyEvent();
		switch (event.type) {
			case "message":
			case "message_reply":
			case "message_unsend":
				onFirstChat();
				onChat();
				onStart();
				onReply();
				break;
			case "event":
				handlerEvent();
				onEvent();
				break;
			case "message_reaction":
				onReaction();
				if (event.reaction == "😠") {
					message.unsend(event.messageID)
				}

				break;
			case "typ":
				typ();
				break;
			case "presence":
				presence();
				break;
			case "read_receipt":
				read_receipt();
				break;
			// case "friend_request_received":
			// { /* code block */ }
			// break;

			// case "friend_request_cancel"
			// { /* code block */ }
			// break;
			default:
				break;
		}
	};
};