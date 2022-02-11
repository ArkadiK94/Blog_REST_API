exports.asyncError = (err,next,statusCode) => {
  const newError = new Error(err);
  newError.httpStatusCode = statusCode;
  next(newError);
}

exports.syncError = (err,statusCode) => {
  const newError = new Error(err);
  newError.httpStatusCode = statusCode;
  throw newError;
}