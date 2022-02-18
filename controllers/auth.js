const {validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");

const User = require("../model/user");
const errorHandle = require("../util/error");


exports.postSignup = (req, res, next)=>{
  const err = validationResult(req);
  const email = req.body.email;
  const password= req.body.password;
  const name = req.body.name;
  if(!err.isEmpty()){
    const errMsg = error.array()[0].msg;
    return errorHandle.syncError(errMsg, 422);
  }
  bcrypt.hash(password, 12)
    .then(hasedPassword =>{
      const user = new User({email: email, name: name, password: hasedPassword});
      return user.save();
    })
    .then(() =>{
      res.status(201).json({massage: "The User was created"})
    })
    .catch(err =>{
      errorHandle.asyncError(err, 500);
    });

}