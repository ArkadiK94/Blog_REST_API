require("dotenv").config();

const expect = require("chai").expect;
const proxyquire = require("proxyquire").noPreserveCache();
const mongoose = require("mongoose");
const sinon = require("sinon");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../model/user");
const authController = require("../controllers/auth");
const shouldThrowError = require("./util-test/throw-error");
const next = require("./util-test/next-func");

describe("Controllers Auth",function(){
  let req, res, user;
  before(function(done){
    mongoose.connect(process.env.MONGODB_URI_TEST)
      .then(()=>{
        user = new User({
          email: "test@test.com",
          password: "xyz",
          name: "test",
          _id: "9999aa99a9a99aa999a99a99"  // random id
        });
        return user.save();
      })
      .then(()=>{
        done();
      })
      .catch(err =>{
        errorHandle.syncError(err);
      });
  });
  beforeEach(function(){
    req = {
      body:{
        email: "test2@test.com",
        password: "xyz",
        name: "test",
        status: "Testing"
      },
      userId: "9999aa99a9a99aa999a99a99"
    };
    res = {
      statusCode: 500,
      message: "",
      token: {
        email: "",
        userId:""
      },
      userId: "",
      userStatus: "",
      status: function(code){
        this.statusCode = code;
        return this;
      },
      json: function(data){
        this.userStatus = data.status;
        this.message = data.message;
        this.token = data.token;
        this.userId = data.userId;
      }
    }
  });
  describe("Controllers Auth - postSignup",function(){
    let authControllerSeamed;
    beforeEach(function(){
      authControllerSeamed = proxyquire("../controllers/auth",{"express-validator":{
        validationResult:()=>{
          return {
            isEmpty:()=>{
              return true
            }
          };
        }
      }});    
    });
    it("should throw an error if the there is validation errors",function(done){
      authControllerSeamed = proxyquire("../controllers/auth",{"express-validator":{
        validationResult:()=>{
          return {
            isEmpty:()=>{
              return false;
            },
            array:()=>{
              return [];
            }
          };
        }
      }});
      shouldThrowError(authControllerSeamed.postSignup(res,{},next),done,422,"Validation failed",true);
      
    });
    it("should throw an error if this user already exist",function(done){
      req.body.email = "test@test.com";
      shouldThrowError(authControllerSeamed.postSignup(req,{},next),done,403,"This user is already exists");
    });
    it("should return the user and response data as expected",function(done){
      authControllerSeamed = proxyquire("../controllers/auth",{"bcryptjs":{
        hash:()=>{
          return req.body.password;
        }
      }});  
      authControllerSeamed.postSignup(req,res,next)
        .then(result=> {
          expect(res).to.include({"statusCode":201,"message":"The User was created"});
          expect(result).to.include({"email":req.body.email,"password":req.body.password,"name":req.body.name});
          done();
        })
        .catch(err => {
          console.log(err);
        });
    });
  });
  describe("Controllers Auth - postLogin", function(){
    it("should throw an error if there is not a matching user",function(done){
      req.body.email = "error@error.com";
      shouldThrowError(authController.postLogin(req,{},next),done,404,"User not found");
    });
    it("should throw an error if the password is not valid",function(done){
      req.body.email = "test@test.com";
      shouldThrowError(authController.postLogin(req,{},next),done,401,"Pls, enter a valid password");
    });
    it("should get the response with correctly defined data",function(done){
      req.body.email = "test@test.com";
      sinon.stub(bcrypt,"compare");
      bcrypt.compare.returns(true);
      sinon.stub(jwt,"sign");
      jwt.sign.returnsArg(0);
      authController.postLogin(req,res,next)
        .then(()=>{
          expect(res)
            .to.include({"statusCode":200,"userId":user._id.toString()})
            .to.nested.include({"token.email":user.email,"token.userId":user._id.toString()});
          bcrypt.compare.restore();
          jwt.sign.restore();
          done();
        })
        .catch(err =>{
          console.log(err);
        });
    });
  });
  describe("Controllers Auth - getStatus", function(){
    it("should throw an error if the user is not found",function(done){
      req.userId = "9999aa99a9a99aa999a99a00";
      shouldThrowError(authController.getStatus(req,{},next),done,404,"User not found");
    });
    it("should get the response with correctly defined data",function(done){
      authController.getStatus(req,res,next)
        .then(()=>{
          expect(res)
            .to.include({"statusCode":200,"message":"The status was fetched","userStatus":user.status});
          done();
        })
        .catch(err =>{
          console.log(err);
        });
    });
  });
  describe("Controllers Auth - postStatus",function(){
    it("should throw an error if the user is not found",function(done){
      req.userId = "9999aa99a9a99aa999a99a00";
      shouldThrowError(authController.postStatus(req,{},next),done,404,"User not found");
      
    });
    it("should get the response with correctly defined data ",function(done){
      authController.postStatus(req,res,next)
        .then((updatedUser)=>{
          expect(res)
            .to.include({"statusCode":200,"message":"The status was updeted"});
          expect(updatedUser).to.have.property("status","Testing");
          done();
        })
        .catch(err =>{
          console.log(err);
        });
    });
  });
  after(function(done){
    User.deleteMany({})
    .then(()=>{
      return mongoose.disconnect()
    })
    .then(()=>{
      done();
    })
    .catch(err =>{
      errorHandle.syncError(err);
    })
  });
});