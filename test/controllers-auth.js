require("dotenv").config();

const expect = require("chai").expect;
const proxyquire = require("proxyquire").noPreserveCache();
const mongoose = require("mongoose");

const User = require("../model/user");
const authController = require("../controllers/auth");

describe("Controllers Auth",function(){
  let req, res;
  before(function(done){
    mongoose.connect(process.env.MONGODB_URI_TEST)
      .then(()=>{
        const user = new User({
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
        console.log(err);
        errorHandle.syncError(err);
      });
  });
  beforeEach(function(){
    req = {
      body:{
        email: "test2@test.com",
        password: "xyz",
        name: "test",
      },
      userId: "9999aa99a9a99aa999a99a99"
    };
    res = {
      statusCode: 500,
      message: "",
      status: function(code){
        this.statusCode = code;
        return this;
      },
      json: function(data){
        this.userStatus = data.status;
        this.message = data.message;
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