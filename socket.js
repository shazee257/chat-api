const socketIO = require('socket.io');
const { updateUser } = require('./models/userModel');

let io;

exports.io = (server) => {
    io = socketIO(server);
    io.on('connection', async (socket) => {
        const userObj = await updateUser({ _id: socket?.handshake?.auth?.user_id }, { $set: { online: true } })

        // broadcast to all users except the one who is connected
        socket.broadcast.emit('user-connected', userObj);



        // disconnect
        socket.on('disconnect', async () => {
            const userObj = await updateUser({ _id: socket?.handshake?.auth?.user_id }, { $set: { online: false } })
            socket.broadcast.emit('user-disconnected', userObj);
        });
    });
};

// send message to specific user
exports.sendMessageIO = (receiverId, messageObj) => {
    io.emit(`send-message-${receiverId}`, messageObj);
}

// seen all messages (inboxId, receiverId)
exports.seenAllMessagesIO = (inboxId, receiverId, payload) => {
    io.emit(`seen-all-messages-${inboxId}-${receiverId}`, payload);
}

// is deleted for all
exports.isDeletedForAllIO = (receiverId, messageObj) => {
    io.emit(`deleted-for-all-${receiverId}`, messageObj);
}
