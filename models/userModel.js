'use strict';

const { Schema, model, Types } = require('mongoose');
const { sign } = require('jsonwebtoken');
const { ROLES } = require('../utils/constants');

const userSchema = new Schema({
    email: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true },
    role: { type: String, enum: Object.values(ROLES), default: "user" },
    image: { type: String, default: null },
    online: { type: Boolean, default: false },
}, { timestamps: true });

const UserModel = model('User', userSchema);

// create new user
exports.createUser = (obj) => UserModel.create(obj);

// find user by query
exports.findUser = (query) => UserModel.findOne(query);

// generate jwt token
exports.generateToken = (user) => {
    const token = sign({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
    }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
    return token;
}

// update user
exports.updateUser = (query, obj) => UserModel.findOneAndUpdate(query, obj, { new: true });

// fetch users
exports.fetchUsers = (query) => UserModel.find(query);
