'use strict';

let { Schema, model, Types } = require("mongoose");

const ChatSchema = new Schema({
    users: [{ type: Types.ObjectId, ref: "User", required: true }],
    channel: { type: String, required: true },
    lastMessage: { type: Types.ObjectId, ref: "Message" },
    deletedBy: [{ type: Types.ObjectId, ref: "User" }],
}, { timestamps: true });

const ChatModel = model("Chat", ChatSchema);

// create new chat
exports.createChat = (obj) => ChatModel.create(obj);

// update last message in chat
exports.updateChat = (query, obj) => ChatModel.updateOne(query, obj, { new: true });

// find chats by query
exports.findChats = async (userId) => {
    const chatList = await ChatModel.aggregate([
        // Match only the chats that have at least one message
        {
            $match: {
                lastMessage: { $exists: true },
                users: Types.ObjectId(userId), // Match chats where the user is a participant
            },
        },
        // Lookup to join the 'Message' collection and retrieve the unread messages
        {
            $lookup: {
                from: "messages", // collection name in plural form
                localField: "lastMessage",
                foreignField: "_id",
                as: "unreadMessages",
            },
        },
        // Filter the joined documents to include only the unread messages
        {
            $addFields: {
                unreadMessages: {
                    $filter: {
                        input: "$unreadMessages",
                        as: "message",
                        cond: {
                            $and: [
                                { $eq: ["$$message.isRead", false] }, // Unread messages
                                { $ne: ["$$message.sender", Types.ObjectId(userId)] }, // Not sent by the user
                            ],
                        },
                    },
                },
            },
        },
        // Add the 'unreadCount' field to the chat document
        {
            $addFields: {
                unreadCount: { $size: "$unreadMessages" },
            },
        },
        // Project only the desired fields in the output
        {
            $project: {
                _id: 1,
                channel: 1,
                users: 1,
                lastMessage: 1,
                deletedBy: 1,
                unreadCount: 1,
            },
        },
    ]);

    return chatList;

}
// ChatModel.find(query)
//     .populate('users lastMessage', 'name image text createdAt')
//     .sort({ updatedAt: -1 });

// find chat by query
exports.findChat = (query) => ChatModel.findOne(query).populate('users lastMessage', 'name image text createdAt');