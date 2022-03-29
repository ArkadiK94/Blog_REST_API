require("dotenv").config();

const expect = require("chai").expect;
const proxyquire = require("proxyquire").noPreserveCache();
const mongoose = require("mongoose");
const sinon = require("sinon");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../model/user");
const authController = require("../controllers/auth");

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
    it("should throw error if the there is validation errors",function(done){
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
      authControllerSeamed.postSignup({},{},()=>{})
        .then(result=> {
          expect(result)
            .to.be.an("error")
            .to.include({"message":"Validation failed","httpStatusCode":422})
            .to.have.property("data");
          done();
        })
        .catch(err => {
          expect(err)
            .to.be.an("error")
            .to.include({"message":"Validation failed","httpStatusCode":422})
            .to.have.property("data");
          done();
        });
    });
    it("should throw error if this user already exist",function(done){
      req.body.email = "test@test.com";
      authControllerSeamed.postSignup(req,{},()=>{})
        .then(result=> {
          expect(result)
            .to.be.an("error")
            .to.include({"message":"This user is already exists","httpStatusCode":403})
          done();
        })
        .catch(err => {
          expect(err)
            .to.be.an("error")
            .to.include({"message":"This user is already exists","httpStatusCode":403})
          done();
        });
    });
    it("should return the user and response data as expected",function(done){
      authControllerSeamed = proxyquire("../controllers/auth",{"bcryptjs":{
        hash:()=>{
          return req.body.password;
        }
      }});  
      authControllerSeamed.postSignup(req,res,()=>{})
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
    it("should throw error if there is not a matching user",function(done){
      req.body.email = "error@error.com";
      authController.postLogin(req,{},()=>{})
        .then(result=>{
          expect(result)
            .to.be.an("error")
            .to.include({"message":"User not found","httpStatusCode":404});
          done();
        })
        .catch(err =>{
          expect(err)
            .to.be.an("error")
            .to.include({"message":"User not found","httpStatusCode":404});
          done();
        });
    });
    it("should throw error if the password is not valid",function(done){
      req.body.email = "test@test.com";
      authController.postLogin(req,{},()=>{})
        .then(result=>{
          expect(result)
            .to.be.an("error")
            .to.include({"message":"Pls, enter a valid password","httpStatusCode":401});
          done();
        })
        .catch(err =>{
          expect(err)
            .to.be.an("error")
            .to.include({"message":"Pls, enter a valid password","httpStatusCode":401});
          done();
        });
    });
    it("should check if the response data defined correctly",function(done){
      req.body.email = "test@test.com";
      sinon.stub(bcrypt,"compare");
      bcrypt.compare.returns(true);
      sinon.stub(jwt,"sign");
      jwt.sign.returnsArg(0);
      authController.postLogin(req,res,()=>{})
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
    it("should throw error if the user not found",function(done){
      req.userId = "9999aa99a9a99aa999a99a00";
      authController.getStatus(req,{},()=>{})
        .then(result=>{
          expect(result)
            .to.be.an("error")
            .to.include({"message":"User not found","httpStatusCode":404});
          done();
        })
        .catch(err =>{
          expect(err)
            .to.be.an("error")
            .to.include({"message":"User not found","httpStatusCode":404});
          done();
        });
    });
    it("should check if the response data defined correctly",function(done){
      authController.getStatus(req,res,()=>{})
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
    it("should throw error if the user not found",function(done){
      req.userId = "9999aa99a9a99aa999a99a00";
      authController.postStatus(req,{},()=>{})
        .then(result=>{
          expect(result)
            .to.be.an("error")
            .to.include({"message":"User not found","httpStatusCode":404});
          done();
        })
        .catch(err =>{
          expect(err)
            .to.be.an("error")
            .to.include({"message":"User not found","httpStatusCode":404});
          done();
        });
    });
    it("should check if the response data defined correctly",function(done){
      authController.postStatus(req,res,()=>{})
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