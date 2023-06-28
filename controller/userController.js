'use strict';

const {
    generateResponse,
    parseBody,
} = require('../utils');
const {
    findUser,
    createUser,
    generateToken,
    fetchUsers,
} = require('../models/userModel');
const { compare, hash } = require('bcrypt');
const { STATUS_CODES } = require('../utils/constants');
const { Types } = require('mongoose');

// register new user
exports.register = async (req, res, next) => {
    const body = parseBody(req.body);

    if (req.file) body.image = `users/${req.file.filename}`;

    try {
        const userExists = await findUser({ email: body.email });
        if (userExists) return next({
            statusCode: STATUS_CODES.BAD_REQUEST,
            message: 'User already exists'
        });

        // hash password
        const hashedPassword = await hash(body.password, 10);
        body.password = hashedPassword;

        const user = await createUser(body);
        generateResponse(user, "User created successfully", res);
    } catch (error) {
        next(new Error(error.message));
    }
}

// login user
exports.login = async (req, res, next) => {
    const body = parseBody(req.body);
    const { email, password } = body;

    try {
        const user = await findUser({ email }).select('+password');
        if (!user) return next({ statusCode: STATUS_CODES.BAD_REQUEST, message: 'User not found' });

        const isMatch = await compare(password, user.password);
        if (!isMatch) return next({ statusCode: STATUS_CODES.BAD_REQUEST, message: 'Invalid credentials' });

        const token = generateToken(user);
        req.session.token = token;
        generateResponse({ user, token }, 'Login successful', res);
    } catch (error) {
        next(new Error(error.message));
    }
}

// logout user for web
exports.logout = async (req, res, next) => {
    req.session = null;
    generateResponse(null, 'Logout successful', res);
}


// get a user 
exports.getUser = async (req, res, next) => {
    const userId = req.user.id;

    try {
        const user = await findUser({ _id: userId });
        generateResponse(user, 'User fetched successfully', res);
    } catch (error) {
        next(new Error(error.message));
    }
}

// get users
exports.getUsers = async (req, res, next) => {
    const { searchTerm } = req.query;
    const userId = req.user.id;

    const query = searchTerm ? {
        $and: [
            { _id: { $ne: Types.ObjectId(userId) } },
            {
                $or
                    : [
                        { name: { $regex: searchTerm, $options: 'i' } },
                        { email: { $regex: searchTerm, $options: 'i' } }
                    ]
            }
        ]
    } : { _id: { $ne: Types.ObjectId(userId) } };

    try {
        const users = await fetchUsers(query);
        generateResponse(users, 'Users fetched successfully', res);
    } catch (error) {
        next(new Error(error.message));
    }
}
