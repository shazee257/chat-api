'use strict';

const { generateResponse, parseBody } = require('../utils');
const {
    createMessage,
    findMessage,
    findMessages,
} = require('../models/messageModel');
const { STATUS_CODES } = require('../utils/constants');
// const {
//     sendMessageIO,
//     seenAllMessagesIO,
//     isDeletedForAllIO
// } = require('../socket');

// create new message
exports.sendMessage = async (req, res, next) => {
    const { receiver, text } = parseBody(req.body);
    const sender = req.user.id;

    try {

        // find created channel or create new channel
        let { channel } = await findMessage({ sender, receiver });

        let message;
        if (!channel) {
            const channel = `${sender}-${receiver}`;
            message = await createMessage({ sender, receiver, text, channel });
            // sendMessageIO(message);
            generateResponse(message, "Send successfully", res);
        }

        console.log("channel already exist");
        message = await createMessage({ sender, receiver, text, channel });

        // sendMessageIO(message);
        generateResponse(message, "Send successfully", res);
    } catch (error) {
        next(new Error(error.message));
    }
}