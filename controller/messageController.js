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
        let isChannel = await findMessage({ sender, receiver });

        let message;
        if (!isChannel) {
            const channel = `${sender}-${receiver}`;
            message = await createMessage({ sender, receiver, text, channel });
            sendMessageIO(receiver, message);
            generateResponse(message, "Send successfully", res);
            return;
        }

        console.log("channel already exist");
        message = await createMessage({ sender, receiver, text, channel: isChannel.channel });

        sendMessageIO(receiver, message);
        generateResponse(message, "Send successfully", res);
    } catch (error) {
        next(new Error(error.message));
    }
}

// get user messages
exports.getMessages = async (req, res, next) => {
    const { receiver } = req.params;
    const sender = req.user.id;

    try {
        const { channel } = await findMessage({ sender, receiver })
        if (!channel) {
            generateResponse(null, "No messages found", res, STATUS_CODES.NOT_FOUND);
            return;
        }

        const messages = await findMessages({ channel });
        // .populate('sender', 'fullName image online')
        generateResponse(messages, "Messages fetched successfully", res);
    } catch (error) {
        next(new Error(error.message));
    }
}