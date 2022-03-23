const errorHandle = require("./error");

const deleteFile = async (filePath,s3)=>{
  const key = filePath.split("/")[3];
  try {
    await s3.deleteObject({Bucket:process.env.BUCKET, Key:key}).promise()
      .catch(err=>{
        throw new Error(err);
      });
  } catch(err){
    errorHandle.syncError(err);
  }
}

exports.deleteFile = deleteFile;