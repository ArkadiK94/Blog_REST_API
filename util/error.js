const errorGeneral = (err,statusCode)=>{
  let newError = err;
  if(!(newError instanceof Error)){
    newError = new Error(err);
  }
  if(!err.httpStatusCode){
    newError.httpStatusCode = statusCode;
  }
  return newError;
}

exports.asyncError = (err,next,statusCode=500) => {
  const newError = errorGeneral(err,statusCode);
  next(newError);
  return newError; // for testing cases
}

exports.syncError = (err,statusCode=500) => {
  const newError = errorGeneral(err,statusCode);
  throw newError;
}

