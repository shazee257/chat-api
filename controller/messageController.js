'use strict';

const { generateResponse, parseBody } = require('../utils');
const {
    createMessage,
    findMessage,
    findMessages,
} = require('../models/messageModel');
const { STATUS_CODES } = require('../utils/constants');
const {
    sendMessageIO,
    //     seenAllMessagesIO,
    //     isDeletedForAllIO
} = require('../socket');

// create new message
exports.sendMessage = async (req, res, next) => {
    const { receiver, text } = parseBody(req.body);
    const sender = req.user.id;

    try {

        // find created channel or create new channel
        let isChannel = await findMessage({
            $or: [
                { channel: `${sender}-${receiver}` },
                { channel: `${receiver}-${sender}` }
            ]
        });

        let channel;
        if (!isChannel) channel = `${sender}-${receiver}`;
        else channel = isChannel.channel;

        const message = await createMessage({ sender, receiver, text, channel });

        if (message) {
            const newMessage = await findMessage({ _id: message._id }).populate('sender receiver', 'fullName image');
            sendMessageIO(receiver, newMessage);
            generateResponse(newMessage, "Send successfully", res);
        }
    } catch (error) {
        next(new Error(error.message));
    }
}

// get user messages
exports.getMessages = async (req, res, next) => {
    const { receiver } = req.params;
    const sender = req.user.id;

    try {
        const isMessageExists = await findMessage({
            $or: [
                { channel: `${sender}-${receiver}` },
                { channel: `${receiver}-${sender}` }
            ]
        });

        console.log("isMessageExists", isMessageExists);

        if (!isMessageExists) {
            console.log("No messages found");
            generateResponse(null, "No messages found", res, STATUS_CODES.NOT_FOUND);
            return;
        }

        const messages = await findMessages({
            $or: [
                { channel: `${sender}-${receiver}` },
                { channel: `${receiver}-${sender}` }
            ]
        });
        // .populate('sender', 'fullName image online')
        generateResponse(messages, "Messages fetched successfully", res);
    } catch (error) {
        next(new Error(error.message));
    }
}