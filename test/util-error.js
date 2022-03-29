const expect = require("chai").expect;

const errorHandle = require("../util/error");

describe("Util Error",function(){
  let next;
  before(function(){
    next = (error = false)=>{ // doing unit testing for now so there is no use in next() functionality
      if(error){
        return false;
      } else {
        () =>{};
      }
    };
  });
  it("should throw an error",function(){
    let err = "xyz";
    expect(errorHandle.asyncError.bind(this,err,next)).to.throw();
    
  });
  describe("Util Error - return the error",function(){
    before(function(){
      next = (error = false)=>{
        if(error){
          return true;
        }
      }; 
    })
    it("should wrap with Error if the 'error' input is not instance of error",function(){
      let err = "xyz";
      expect(errorHandle.asyncError(err,next)).to.be.an("error");
  
    });
    it("should update the status code in case there is not one already ",function(){
      let err = "xyz";
      expect(errorHandle.asyncError(err,next)).to.have.property("httpStatusCode");
  
    });
    

  });
});