// Lets async route handlers throw; errors go to the error middleware in server.js
exports.wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

exports.httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};
