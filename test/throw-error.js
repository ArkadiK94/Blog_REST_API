const expect = require("chai").expect;

let shouldThrowError = (promise,done,statusCode=500,message="",dataProperty=false)=>{
  promise
    .then(result=> {
      if(dataProperty){
        expect(result)
          .to.be.an("error")
          .to.include({"message":message,"httpStatusCode":statusCode})
          .to.have.property("data");
      } else if(message){
        expect(result)
          .to.be.an("error")
          .to.include({"message":message,"httpStatusCode":statusCode});
      } else {
        expect(result)
          .to.be.an("error");
      }
      done();
    })
    .catch(err => {
      if(dataProperty){
        expect(err)
          .to.be.an("error")
          .to.include({"message":message,"httpStatusCode":statusCode})
          .to.have.property("data");
      } else if(message){
        expect(err)
          .to.be.an("error")
          .to.include({"message":message,"httpStatusCode":statusCode});
      } else {
        expect(err)
          .to.be.an("error");
      }
      done();
    });
};

module.exports = shouldThrowError;