/*jshint esversion: 6 */

var express = require('express');
var path = require('path');
var router = express.Router();
var User = require(path.join(__BASEDIR, 'models/User'));
var util = require(path.join(__BASEDIR, 'util'));
var jwt = require('jsonwebtoken');

const JWT_SECRET = util.JWT_SECRET;
const TOKEN_EXPIRE_TIME = process.env.TOKEN_EXPIRE_TIME || 43200;

// login
router.post('/login', function (req, res, next) {
	util.log("## /login -> validation check:" + req.body.username + "/"
		+ req.body.password);
	var isValid = true;
	var validationError = {
		name: 'ValidationError',
		errors: {}
	};

	if (!req.body.username) {
		isValid = false;
		validationError.errors.username = {
			message: 'Username is required!'
		};
	}
	if (!req.body.password) {
		isValid = false;
		validationError.errors.password = {
			message: 'Password is required!'
		};
	}

	if (!isValid)
		return res.json(util.successFalse(validationError));
	else
		next();
}, function (req, res, next) {
	util.log("## /login -> do login");
	User.findOne({
		username: req.body.username
	}).select({
		password: 1,
		username: 1,
		name: 1,
		email: 1
	}).exec(
		function (err, user) {
			if (err) {
				console
					.log("# error:get get the user:"
						+ req.body.username);
				return res.json(util.successFalse(err));
			} else if (!user || !user.authenticate(req.body.password))
				return res.json(util.successFalse(null,
					'Username or Password is invalid'));
			else {
				var payload = {
					_id: user._id,
					username: user.username,
					name: user.name
				};
				console
					.log("# get user:" + user._id + ", "
						+ user.username);

				var secretOrPrivateKey = JWT_SECRET;
				var options = {
					expiresIn: TOKEN_EXPIRE_TIME * 1
				};
				util.log("# token expire time:" + TOKEN_EXPIRE_TIME * 1 + "::" + options.expiresIn);
				jwt.sign(payload, secretOrPrivateKey, options, function (
					err, token) {
					util.log("# generate token");
					if (err) {
						util.log("# error !");
						return res.json(util.successFalse(err));
					}
					util.log("# token:" + token);
					res.json(util.successTrue(token));
				}); 
			}
		});
});

// me-
router.get('/me', util.isLoggedin, function (req, res, next) {
	User.findById(req.decoded._id).exec(function (err, user) {
		if (err || !user)
			return res.json(util.successFalse(err));
		res.json(util.successTrue(user));
	});
});

// refresh
router.get('/refresh', util.isLoggedin, function (req, res, next) {
	User.findById(req.decoded._id).exec(
		function (err, user) {
			if (err || !user)
				return res.json(util.successFalse(err));
			else {
				var payload = {
					_id: user._id,
					username: user.username,
					name: user.name
				};
				var secretOrPrivateKey = JWT_SECRET;
				var options = {
					expiresIn: 60 * 60 * 24
				};
				jwt.sign(payload, secretOrPrivateKey, options, function (
					err, token) {
					if (err)
						return res.json(util.successFalse(err));
					res.json(util.successTrue(token));
				});
			}
		});
});

module.exports = router;
