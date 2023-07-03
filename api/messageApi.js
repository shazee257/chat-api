'use strict';

const { Router } = require('express');
const {
    sendMessage,
    getMessages,
    getChatList,
} = require('../controller/messageController');
const { upload } = require('../utils');
const authMiddleware = require('../middlewares/Auth');
const { ROLES } = require('../utils/constants');

class MessageAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        let router = this.router;

        router.get('/chat-list', authMiddleware(Object.values(ROLES)), getChatList);
        router.get('/:user', authMiddleware(Object.values(ROLES)), getMessages);
        router.post('/send', authMiddleware(Object.values(ROLES)), sendMessage);
        // upload('messages').single('image'), 
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/message';
    }
}

module.exports = MessageAPI;