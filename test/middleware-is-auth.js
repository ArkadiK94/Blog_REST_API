const expect = require("chai").expect;
const jwt = require("jsonwebtoken");
const sinon = require("sinon");

const isAuth = require('../middleware/is-auth');
const next = require("./util-test/next-func");
 

describe("Middleware Is Auth",function(){
  it("should throw an error if no authorization header is present",function(){
    const req = {
      get: function(header){
        return false;
      }
    }
    expect(isAuth.bind(this,req,{},next)).to.throw("Not Authorized");
  });
  it("should throw an error if the token is only one word",function(){
    const req = {
      get: function(header){
        return "xyz";
      }
    }
    expect(isAuth.bind(this,req,{},next)).to.throw("jwt must be provided");
  });
  it("should throw an error if the token could not been decoded properly",function(){
    const req = {
      get: function(header){
        return "Bearer xyz";
      }
    }
    expect(isAuth.bind(this,req,{},next)).to.throw();
  });
  describe("Middleware Is Auth - with jwt stub",function(){
    beforeEach(function(){
      sinon.stub(jwt,"verify");
    });
    afterEach(function(){
      jwt.verify.restore();
    });
    it("should throw an error if the decoded token dont have a userInfo",function(){
      const req = {
        get: function(header){
          return "Bearer xyz";
        }
      }
      jwt.verify.returns();
      expect(isAuth.bind(this,req,{},next)).to.throw("Not Authorized");
      expect(jwt.verify.called).to.be.true;
    });
    it("should return userId if everything is fine with the token and the data from it",function(){
      const req = {
        get: function(header){
          return "Bearer xyz";
        }
      }
      jwt.verify.returns({userId: "abc"});
      expect(isAuth(req,{},next)).to.have.property("userId");
      expect(jwt.verify.called).to.be.true;
    });
  });

});