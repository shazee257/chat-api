'use strict';

const { verify } = require('jsonwebtoken');
const { STATUS_CODES } = require('../utils/constants');

module.exports = (roles) => {
    return (req, res, next) => {
        const token = req.header('token') || req.session.token;
        if (!token) {
            return next({
                statusCode: STATUS_CODES.UNAUTHORIZED,
                message: 'Authorization failed!'
            });
        }

        verify(token, process.env.JWT_SECRET, function (err, decoded) {
            if (err) {
                return next({
                    statusCode: STATUS_CODES.UNAUTHORIZED,
                    message: 'Invalid token!'
                })
            }
            req.user = { ...decoded };
            if (roles.includes(req.user.role)) {
                next();
            }
            else {
                return next({
                    statusCode: STATUS_CODES.UNAUTHORIZED,
                    message: 'Unauthorized access!'
                });
            }
        });
    }
}