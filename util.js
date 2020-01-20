global.__isDebugMode = true;

var jwt = require('jsonwebtoken');

var util = {};

//console log
util.log = function(msg) {
	if(__isDebugMode) console.log(msg);
}

const JWT_SECRET = process.env.JWT_SECRET || "MySecretKey";
util.JWT_SECRET = JWT_SECRET;

util.successTrue = function(data) {
	return {
		success : true,
		message : "",
		errors : "",
		data : data
	};
};

util.successFalse = function(err, message) {
	if (!err && !message)
		message = 'data not found';
	return {
		success : false,
		message : message,
		errors : (err) ? JSON.stringify(util.parseError(err)) : "",
		data : ""
	};
};

util.parseError = function(errors) {
	var parsed = {};
	if (errors.name == 'ValidationError') {
		for ( var name in errors.errors) {
			var validationError = errors.errors[name];
			parsed[name] = {
				message : validationError.message
			};
		}
	} else if (errors.code == '11000' && errors.errmsg.indexOf('username') > 0) {
		parsed.username = {
			message : 'This username already exists!'
		};
	} else {
		parsed.unhandled = errors;
	}
	return parsed;
};

// middlewares
util.isLoggedin = function(req, res, next) {
	var token = req.headers['x-access-token'];
	if (!token)
		return res.json(util.successFalse(null, 'token is required!'));
	else {
		util.log("## verify target token ==>" + token);
		jwt.verify(token, JWT_SECRET, function(err, decoded) {
			if (err) {
				util.log("error=>" + err.message);
				return res.json(util.successFalse(err));
			} else {
				util.log("success to verify => " + decoded);
				req.decoded = decoded;
				next();
			}
		});
	}
};

module.exports = util;
