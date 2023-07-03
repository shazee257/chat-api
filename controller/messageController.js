'use strict';

const { generateResponse, parseBody } = require('../utils');
const {
    createMessage,
    findMessage,
    findMessages,
    updateMessages,
    getChatListFromMessages
} = require('../models/messageModel');
const { STATUS_CODES } = require('../utils/constants');
const {
    sendMessageIO,
    //     seenAllMessagesIO,
    //     isDeletedForAllIO
} = require('../socket');

const { updateChat, createChat, findChats, findChat } = require('../models/chatModel');

// create new message
exports.sendMessage = async (req, res, next) => {
    const { receiver, text } = parseBody(req.body);
    const sender = req.user.id;

    try {

        // find created channel or create new channel
        let isChannel = await findChat({
            $or: [{ channel: `${sender}-${receiver}` }, { channel: `${receiver}-${sender}` }]
        });

        let channel;
        if (!isChannel) {
            // create chat / new channel
            channel = `${sender}-${receiver}`;
            await createChat({
                users: [sender, receiver],
                channel
            });
        }
        else channel = isChannel.channel;

        const message = await createMessage({ sender, text, channel });

        // update last message in chat
        await updateChat({ channel }, { lastMessage: message._id });

        if (message) {
            const newMessage = await findMessage({ _id: message._id }).populate('sender', 'name image');
            // sendMessageIO(receiver, newMessage);
            generateResponse(newMessage, "Send successfully", res);
        }
    } catch (error) {
        next(new Error(error.message));
    }
}

// get user messages
exports.getMessages = async (req, res, next) => {
    const { user } = req.params;
    const loginUser = req.user.id;

    try {
        // update all messages to seen
        await updateMessages({
            $or: [{ channel: `${user}-${loginUser}` }, { channel: `${loginUser}-${user}` }],
            sender: user
        }, { isRead: true });

        const messages = await findMessages({
            $or: [
                { channel: `${loginUser}-${user}` },
                { channel: `${user}-${loginUser}` }
            ]
        });

        if (messages.length === 0 || !messages) {
            console.log("No messages found");
            generateResponse(null, "No messages found", res, STATUS_CODES.NOT_FOUND);
            return;
        }

        generateResponse(messages, "Messages fetched successfully", res);
    } catch (error) {
        next(new Error(error.message));
    }
}

// get chat list
exports.getChatList = async (req, res, next) => {
    const userId = req.user.id;

    try {
        const chats = await findChats(userId);

        if (chats.length === 0 || !chats) {
            generateResponse(null, "No chats found", res);
            return;
        }

        generateResponse(chats, "Chats fetched successfully", res);
    } catch (error) {
        next(new Error(error.message));
    }
}
