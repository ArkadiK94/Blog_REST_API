const {validationResult} = require("express-validator");

const Post = require("../model/post"); 
const errorHandle = require("../util/error");
const fileHelper = require("../util/file"); 

exports.getPosts = (req, res, next)=>{
  const page = req.query.page;
  let totalItems = 0;
  const POSTS_PER_PAGE = 2;
  Post.find()
    .countDocuments()
    .then(numOfPosts =>{
      totalItems = numOfPosts;
      return Post.find().skip((page-1)*POSTS_PER_PAGE).limit(POSTS_PER_PAGE);
    })
    .then(posts =>{
      res.status(200).json({message: "All posts were fetched", posts: posts, totalItems: totalItems});
    })
    .catch(err => errorHandle.asyncError(err, next, 500));
}

exports.createPost = (req, res, next)=>{
  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.file.path.replace(/\\/,"/");
  const post = new Post({title: title, content: content, imageUrl: imageUrl, creator:{name:"Arkadi K"}});
  const error = validationResult(req);
  if(!error.isEmpty()){
    const errMsg = error.array()[0].msg;
    return errorHandle.syncError(errMsg, 422);
  }
  post.save()
    .then(()=>{
      res.status(201).json({message: "New post was created", post:post});
    })
    .catch(err => errorHandle.asyncError(err, next, 500));
}

exports.getPost = (req, res, next)=>{
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post =>{
      if(!post){
        errorHandle.syncError("Post not found", 404);
      }
      res.status(200).json({message: "The post was fetched", post:post})
    })
    .catch(err=> {
      if(!err.httpStatusCode){
        err.httpStatusCode = 500;
      }
      errorHandle.asyncError(err, next, err.httpStatusCode);
    });
}

exports.editPost = (req, res, next)=>{
  const title = req.body.title;
  const content = req.body.content;
  const image = req.file;
  let imageUrl = undefined;
  if(image){
    imageUrl = req.file.path.replace(/\\/,"/");
  }
  const postId = req.params.postId;
  const error = validationResult(req);
  if(!error.isEmpty()){
    const errMsg = error.array()[0].msg;
    return errorHandle.syncError(errMsg, 422);
  }
  let newPost;
  Post.findById(postId)
    .then(post=>{
      if(!post){
        errorHandle.syncError("Post not found", 404);
      }
      post.title = title;
      post.content = content;
      if(imageUrl){
        fileHelper.deleteFile(post.imageUrl);
        post.imageUrl = imageUrl;
      }
      newPost = post;
      return post.save()
    })
    .then(()=>{
      res.status(200).json({message: "The post was updated", post:newPost});
    })
    .catch(err => errorHandle.asyncError(err, next, 500));
}

exports.deletePost = (req, res, next)=>{
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post)=>{
      if(!post){
        errorHandle.syncError("Post not found", 404);
      }
      if(post.imageUrl){
        fileHelper.deleteFile(post.imageUrl);
      }
      return post.remove();
    })
    .then(()=>{
      res.status(200).json({message: "The post was deleted"});
    })
    .catch(err => errorHandle.asyncError(err, next, 500));
}


