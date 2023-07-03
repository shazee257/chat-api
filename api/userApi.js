'use strict';

const router = require('express').Router();
const {
    getUser,
    getUsers,
} = require('../controller/userController');
const authMiddleware = require('../middlewares/Auth');
const { ROLES } = require('../utils/constants');

class UserAPI {
    constructor() {
        this.router = router;
        this.setupRoutes();
    }

    setupRoutes() {
        let router = this.router;

        
        router.get('/me', authMiddleware(Object.values(ROLES)), getUser);
        router.get('/search', authMiddleware(Object.values(ROLES)), getUsers);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/user';
    }
}

module.exports = UserAPI;