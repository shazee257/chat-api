'use strict';

const _ = require('lodash');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FCM = require('fcm-node');
const { STATUS_CODES } = require('./constants');

exports.generateResponse = (data, message, res) => {
    return res.status(STATUS_CODES.OK).send({
        data,
        message
    });
}

exports.parseBody = (body) => {
    let obj;
    if (typeof body === "object") obj = body;
    else obj = JSON.parse(body);
    return obj;
}

exports.generateRandomOTP = () => {
    return Math.floor(10000 + Math.random() * 90000);
}

exports.upload = (folderName) => {
    return multer({
        storage: multer.diskStorage({
            destination: function (req, file, cb) {
                const path = `uploads/${folderName}/`;
                fs.mkdirSync(path, { recursive: true })
                cb(null, path);
            },

            // By default, multer removes file extensions so let's add them back
            filename: function (req, file, cb) {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, uniqueSuffix + '.' + file.originalname.split('.').pop());
            }
        }),
        limits: {
            fileSize: 100 * 1024 * 1024  // max 100MB
        },
        fileFilter: function (req, file, cb) {
            // if (!file.originalname.match(/\.(jpg|JPG|webp|jpeg|JPEG|png|PNG|gif|GIF|jfif|JFIF)$/)) {
            // if (!file.originalname.match(/\.(jpg|JPG|webp|jpeg|JPEG|png|PNG|gif|GIF|jfif|JFIF|mp4|MP4|mov|MOV|avi|AVI|mkv|MKV)$/)) {
            //     // if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
            //     req.fileValidationError = 'Only image / video files are allowed!';
            //     return cb(null, false);
            // }
            if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
                req.fileValidationError = 'Only image / video files are allowed!';
                return cb(null, true);
            }
            cb(null, true);
        }
    })
}

exports.sendNotification = ({ title, body, fcmToken }) => {
    const serverKey = process.env.FIREBASE_SERVER_KEY;
    const fcm = new FCM(serverKey);

    const message = {
        to: fcmToken,
        notification: { title, body }
    };

    fcm.send(message, function (err, response) {
        if (err) {
            console.log("FCM - Something has gone wrong!");
        } else {
            console.log("Successfully sent with response: ", response);
        }
    });
}

exports.getPaginatedData = async ({
    model, page = 1, limit = 10, query = {},
    populate = '', endPoint = '', sort = { createdAt: -1 },
    queryParams = '', select = ''
}) => {
    const count = await model.countDocuments(query);
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    const selectFields = select ? select + '-__v -password' : '-__v -password';

    const result = await model.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(populate)
        .select(selectFields)
        .lean();

    const pagination = {
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        totalItems: count
    };

    // remove page and limit from queryParams
    if (queryParams)
        queryParams = queryParams.split('&')
            .filter(item => !item.includes('page') && !item.includes('limit'))
            .join('&');

    if (hasNextPage)
        pagination.nextPage = `${process.env.BASE_URL}/api/${endPoint ? endPoint : ''}?page=${Number(page) + 1}&limit=${limit}${queryParams ? '&' + queryParams : ''}`;
    else pagination.nextPage = null;

    if (hasPrevPage)
        pagination.prevPage = `${process.env.BASE_URL}/api/${endPoint ? endPoint : ''}?page=${Number(page) - 1}&limit=${limit}${queryParams ? '&' + queryParams : ''}`;
    else pagination.prevPage = null;

    return { result, pagination };
}

exports.commentsWithNestedComments = (allComments) => {
    const commentMap = {};
    const result = [];

    // First create a map of all comments based on their _id
    allComments.forEach(comment => {
        comment.children = [];
        commentMap[comment._id.toString()] = comment;
    });

    // Loop through all comments and add any child comments to their parent's children array
    allComments.forEach(comment => {
        if (comment.parentId) {
            const parentComment = commentMap[comment.parentId.toString()];
            if (parentComment) {
                parentComment.children.push(comment);
            }
        } else {
            // If a comment has no parentId, it is a top-level comment and should be added to the result array
            result.push(comment);
        }
    });

    return result;
}

// competition is an object of competition model
exports.userAddToCompetitionValidation = (competition, userId) => {
    // check if user is already in competition
    const isUserInCompetition = competition.participantIds.includes(userId);
    if (isUserInCompetition) {
        return { isValid: false, message: "You are already in this competition" };
    }

    // check if competition is full
    if (competition.participantIds.length >= competition.maxParticipants) {
        return { isValid: false, message: "Competition is full" };
    }

    // check if competition is expired
    if (competition.status != 'Started') {
        return { isValid: false, message: "Competition is Upcoming / Completed" };
    }

    return { isValid: true, message: "User can join competition" };
}

// check if user is already in competition
exports.isUserInCompetition = (competition, userId) => {
    return competition.participantIds.includes(userId);
}

// check if competition is full
exports.isCompetitionParticipantsFull = (competition) => {
    return competition.participantIds.length >= competition.maxParticipants;
}

// check if competition is expired
exports.isCompetitionExpired = (competition) => {
    return competition.status != 'Started';
    // return competition.endTime < new Date();
}

// check if user can post in competition
exports.isUserPostInCompetitionValidation = (competition, userId) => {
    // is competition expired
    if (competition.status != 'Started') {
        return { isValid: false, message: "Competition is Upcoming / Completed" };
    }

    // is user not in competition
    if (!this.isUserInCompetition(competition, userId)) {
        return { isValid: false, message: "You are not in this competition" };
    }

    // count user post in competition
    const userPostsCount = competition.postIds.filter(post => post.userId.toString() == userId).length;
    console.log("userPostsCount", userPostsCount);

    // check if user post limit is reached
    if (userPostsCount >= competition.maxPostsPerUser) {
        return { isValid: false, message: "You have reached max post limit" };
    }

    return { isValid: true, message: "User Can Post" };
}

// check if user can vote on post
exports.addVoteOnPostValidation = (competition, userId) => {
    // is competition expired
    if (competition.status != 'Started') {
        return { isValid: false, message: "Competition is not running." };
    }

    // is user not in competition
    if (this.isUserInCompetition(competition, userId)) {
        return { isValid: false, message: "You are already Artist in this Competition" };
    }

    return { isValid: true, message: "User Can Vote" };
}

// get endPoint from url
exports.getEndPointFromUrl = (url) => url.split('?')[0].split('/').slice(2).join('/');


exports.getAggregatedPaginatedData = async ({ model, page = 1, limit = 10, query = [], endPoint = '' }) => {
    const pipeline = [...query, { $count: 'totalCount' }];
    let totalCount = await model.aggregate(pipeline);
    if (totalCount.length > 0) totalCount = totalCount[0].totalCount;
    else totalCount = 0;
    if (totalCount == 0) return { result: [], pagination: {} };

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const resultPipeline = [
        ...query,
        // add pagination
        { $skip: (Number(page) - 1) * Number(limit) },
        { $limit: Number(limit) },
    ];

    const result = await model.aggregate(resultPipeline);

    const pagination = {
        currentPage: Number(page),
        totalPages,
        hasNextPage,
        hasPrevPage,
        totalItems: totalCount
    };

    if (hasNextPage)
        pagination.nextPage = `${process.env.BASE_URL}/api/${endPoint ? endPoint : ''}?page=${Number(page) + 1}&limit=${limit}`;
    else pagination.nextPage = null;

    if (hasPrevPage)
        pagination.prevPage = `${process.env.BASE_URL}/api/${endPoint ? endPoint : ''}?page=${Number(page) - 1}&limit=${limit}`;
    else pagination.prevPage = null;

    return { result, pagination };
}

exports.addCommentValidation = (competition) => {
    // is competition expired
    if (competition.status != 'Started') {
        return { isValid: false, message: "Competition is Upcoming / Completed" };
    }

    return { isValid: true, message: "User Can Vote" };
}

exports.bodyParseAndValidate = (body, requiredKeys, next) => {
    // parse body
    let obj;
    if (typeof body === "object") obj = body;
    else obj = JSON.parse(body);

    // check if body is empty
    if (Object.keys(obj).length === 0) {
        return next({
            statusCode: STATUS_CODE.BAD_REQUEST,
            message: 'Please provide required fields'
        });
    }

    // check if required keys are present
    const missingKeys = requiredKeys.filter(key => !obj[key]);
    if (missingKeys.length > 0) {
        // console.log("obj >>>", obj);
        return next({
            statusCode: STATUS_CODE.BAD_REQUEST,
            message: `Please provide ${missingKeys.join(', ')}`
        });
    }
    return obj;
}