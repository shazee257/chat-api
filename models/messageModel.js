'use strict';

let { Schema, model, Types } = require("mongoose");

const MessageSchema = new Schema({
    sender: { type: Types.ObjectId, ref: "User", required: true },
    receiver: { type: Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    channel: { type: String, required: true },
}, { timestamps: true });

const MessageModel = model("Message", MessageSchema);

// create new message
exports.createMessage = (obj) => MessageModel.create(obj);

// find messages by query
exports.findMessages = (query) => MessageModel.find(query);

// find message by query
exports.findMessage = (query) => MessageModel.findOne(query);


