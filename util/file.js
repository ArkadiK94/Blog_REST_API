const errorHandle = require("./error");

const deleteFile = (filePath,s3)=>{
  const key = filePath.split("/")[3];
  s3.deleteObject({Bucket:process.env.BUCKET, Key:key}).promise()
    .catch(err => {
      errorHandle.syncError(err);
    });
}

exports.deleteFile = deleteFile;