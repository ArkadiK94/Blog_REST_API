const deleteFile = require("../util/file").deleteFile; 
const shouldThrowError = require("./throw-error");

describe("Util File",function(){
  it("should throw an error if there is a problem to delete the file",function(done){
    const filePath = "xyz/xyz/xyz";
    const s3 = {
      deleteObject: ({Bucket, Key})=>{
        return {
          promise: ()=>{
            return Promise.reject();
          }
        };
      }
    }
    shouldThrowError(deleteFile(filePath,s3),done);
  });
});