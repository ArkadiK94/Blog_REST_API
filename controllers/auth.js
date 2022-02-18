const {validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../model/user");
const errorHandle = require("../util/error");


exports.postSignup = (req, res, next)=>{
  const err = validationResult(req);
  if(!err.isEmpty()){
    const errMsg = new Error("Validation failed");
    errMsg.data = err.array();
    return errorHandle.syncError(errMsg, 422);
  }
  const email = req.body.email;
  const password= req.body.password;
  const name = req.body.name;
  User.findOne({email:email})
    .then(user=>{
      if(user){
        errorHandle.syncError("This user is already exists", 403);
      }
      return bcrypt.hash(password, 12);

    })
    .then(hasedPassword =>{
      const user = new User({email: email, name: name, password: hasedPassword});
      return user.save();
    })
    .then(() =>{
      res.status(201).json({massage: "The User was created"})
    })
    .catch(err =>{
      errorHandle.asyncError(err,next);
    });

}

exports.postLogin = (req, res, next)=>{
  const email = req.body.email;
  const password = req.body.password;
  let userId;
  User.findOne({email:email})
    .then(user =>{
      if(!user){
        errorHandle.syncError("User not found", 404);
      }
      userId = user._id.toString();
      return bcrypt.compare(password, user.password);
    })
    .then(doMatch=>{
      if(!doMatch){
        errorHandle.syncError("Pls, enter a valid password", 401);
      }
      const token = jwt.sign(
        {
          email: email,
          userId: userId
        }, 
        `${process.env.SECRET_FOR_TOKEN}`,
        {
          expiresIn: "1h"
        } 
      );
      res.status(200).json({token: token, userId: userId});
    })
    .catch(err =>{
      errorHandle.asyncError(err,next);
    });

}