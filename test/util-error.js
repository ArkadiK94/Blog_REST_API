const expect = require("chai").expect;

const errorHandle = require("../util/error");
const next = require("./util-test/next-func");


describe("Util Error",function(){
  it("should throw an error",function(){
    let err = "xyz";
    expect(errorHandle.asyncError.bind(this,err,next)).to.throw();
    
  });
  describe("Util Error - return the error",function(){
    let nextNotThrow;
    before(function(){
      nextNotThrow = (error=false)=>{
        if(error){
          return true;
        }
      }
    });
    it("should wrap with Error if the 'error' input is not instance of error",function(){
      let err = "xyz";
      expect(errorHandle.asyncError(err,nextNotThrow)).to.be.an("error");
    });
    it("should update the status code in case there is not one already ",function(){
      let err = "xyz";
      expect(errorHandle.asyncError(err,nextNotThrow)).to.have.property("httpStatusCode");
    });
  });
});