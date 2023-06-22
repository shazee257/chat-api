'use strict';

const { Router } = require('express')
const { register, login, logout } = require('../controller/userController');
const { upload } = require('../utils');
const authMiddleware = require('../middlewares/Auth');
const { ROLES } = require('../utils/constants');

class AuthAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        let router = this.router;

        router.post('/register', upload('users').single('image'), register);
        router.post('/login', login);
        router.post('/logout', authMiddleware(Object.values(ROLES)), logout);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/auth';
    }
}

module.exports = AuthAPI;