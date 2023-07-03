'use strict';

let { Schema, model, Types } = require("mongoose");

const MessageSchema = new Schema({
    sender: { type: Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    channel: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    deletedBy: [{ type: Types.ObjectId, ref: "User" }],
}, { timestamps: true });

const MessageModel = model("Message", MessageSchema);

// create new message
exports.createMessage = (obj) => MessageModel.create(obj);

// find messages by query
exports.findMessages = (query) => MessageModel.find(query)
    .populate('sender', 'name image')
    .sort({ createdAt: -1 });


// find message by query
exports.findMessage = (query) => MessageModel.findOne(query);

// update message by query
exports.updateMessages = (query, obj) => MessageModel.updateMany(query, obj, { new: true });
