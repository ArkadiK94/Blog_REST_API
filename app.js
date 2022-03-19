require("dotenv").config();

const path = require("path");

const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const helmet= require("helmet");
const compression = require("compression");
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");
const errorHandle = require("./util/error");

const app = express();

aws.config.update({
  secretAccessKey: process.env.ACCESS_SECRET,
  accessKeyId: process.env.ACCESS_KEY,
  region: process.env.REGION
});
const s3 = new aws.S3();
const upload = multer({
  storage:multerS3({
    bucket: process.env.BUCKET,
    s3: s3,
    acl:"public-read",
    key:(req,file,cb)=>{
      const date = new Date().toISOString().replace(/:/g,".");
    cb(null, `${date}-${file.originalname}`);
    }
  })
});

app.use(express.json());
app.use(upload.single("image"));
app.use((req, res, next)=>{
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  req.s3 = s3;
  next();
});
app.use(helmet({
  frameguard:{
    action: "deny"
  }
}));
app.use(compression());

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

app.use((req,res,next)=>{
  errorHandle.syncError("Page Not Found", 404);
});

app.use((err, req, res, next)=>{
  let statusCode = err.httpStatusCode;
  if(!statusCode){
    statusCode = 500;  
  }
  res.status(statusCode).json({message:`${err}`, err:err});
});

mongoose.connect(process.env.MONGODB_URI)
  .then(()=>{
    const server = app.listen(process.env.PORT || 8080);
    const io = require("./socket").init(server);
    io.on("connection",()=>{
      console.log("Client connected");
    });
  })
  .catch(err =>{
    errorHandle.syncError(err);
  });