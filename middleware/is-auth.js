const jwt = require("jsonwebtoken");

const errorHandle = require("../util/error");

module.exports = (req, res, next)=>{
  const authHeader = req.get("Authorization");
  if(!authHeader){
    errorHandle.syncError("Not Authorized",401);
  }
  const token = authHeader.split(" ")[1];
  let decodedToken;
  try{
    decodedToken = jwt.verify(token,process.env.SECRET_FOR_TOKEN);
    if(!decodedToken){
      errorHandle.syncError("Not Authorized",401);
    }
    req.userId = decodedToken.userId;
    next();
    return req; // for testing cases
  }
  catch(err){
    errorHandle.asyncError(err,next);
  }
  
}