const expect = require("chai").expect;

const deleteFile = require("../util/file").deleteFile; 

describe("Util File",function(){
  it("should throw error if there is a problem to delete the file",function(done){
    const filePath = "xyz/xyz/xyz";
    const s3 = {
      deleteObject: ({Bucket, Key})=>{
        return new Promise((resolve,reject)=>{
          return reject("err");
        });
      }
    }
    deleteFile(filePath,s3)
      .then(result=>{
        expect(result).to.be.an("error");
        done();
      })
      .catch(err=>{
        expect(err).to.be.an("error");
        done();
      });
  });
});