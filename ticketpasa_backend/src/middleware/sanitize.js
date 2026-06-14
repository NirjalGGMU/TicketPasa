const { sanitize } = require("express-mongo-sanitize");

// express-mongo-sanitize's own middleware does `req.query = ...`, which throws
// on Express 5 because req.query is a getter-only property. Sanitizing in
// place (mutating the existing object) avoids that reassignment entirely.
const sanitizeRequest = (req, res, next) => {
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  if (req.query) sanitize(req.query);
  next();
};

module.exports = sanitizeRequest;
