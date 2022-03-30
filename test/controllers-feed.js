require("dotenv").config();

const expect = require("chai").expect;
const proxyquire = require("proxyquire").noPreserveCache();
const mongoose = require("mongoose");
const sinon = require("sinon");

const User = require("../model/user");
const Post = require("../model/post"); 
const feedControllers = require("../controllers/feed");
const io = require("../socket");
const shouldThrowError = require("./util-test/throw-error");
const fileHelper = require("../util/file"); 
const next = require("./util-test/next-func");


describe("Controllers Feed",function(){
  let req, res, user, post;
  before(function(done){
    mongoose.connect(process.env.MONGODB_URI_TEST)
      .then(()=>{
        user = new User({
          email: "test@test.com",
          password: "xyz",
          name: "test",
          _id: "9999aa99a9a99aa999a99a99"  // random id
        });
        return user.save();
      })
      .then((user)=>{
        post = new Post({
          title: "post test",
          imageUrl: "/someUrl/post",
          content: "some content for testing",
          creator: user,
          _id: "8888e8eee8e88888ee8ee8e8"
        });
        return post.save();
      })
      .then((post)=>{
        user.posts.push(post);
        return user.save();
      })
      .then(()=>{
        sinon.stub(io,"getIo").returns({
          emit: sinon.stub().returns(true)
        });
        done();
      })
      .catch(err =>{
        errorHandle.syncError(err);
      });
  });
  beforeEach(function(){
    req = {
      body:{
        title: "Testing",
        content: "test xyz",
      },
      file:{
        location: "/someUrl/post"
      },
      query:{
        page: 1
      },
      params:{
        postId: "8888e8eee8e88888ee8ee8e8"
      },
      userId: "9999aa99a9a99aa999a99a99"
    };
    res = {
      statusCode: 500,
      message: "",
      posts: [],
      totalItems: 0,
      post: {},
      status: function(code){
        this.statusCode = code;
        return this;
      },
      json: function(data){
        this.message = data.message;
        this.posts = data.posts;
        this.totalItems = data.totalItems;
        this.post = data.post;
      }
    }
  });
  describe("Controllers Feed - getPosts", function(){
    it("should throw an error in case there was one",function(done){
      shouldThrowError(feedControllers.getPosts(req,{},next),done);
    });
    it("should get the response with correctly defined data",function(done){
      const post1 = new Post({
        title: "post1 test",
        imageUrl: "/someUrl/post",
        content: "some content for testing",
        creator: user,
        _id: "8888e8eee8e88888ee8ee8e9"
      });
      const post2 = new Post({
        title: "post2 test",
        imageUrl: "/someUrl/post",
        content: "some content for testing",
        creator: user,
        _id: "8888e8eee8e88888ee8ee8e7"
      });
      let postsMade;
      post1.save()
        .then(()=>{
          return post2.save();
        })
        .then(()=>{
          postsMade = [post2._id,post1._id];
          feedControllers.getPosts(req,res,next)  
            .then(({posts,POSTS_PER_PAGE})=>{
              expect(res).to.include({"statusCode":200,"message":"All posts were fetched","totalItems":3});
              expect(posts.length).to.equal(POSTS_PER_PAGE);
              posts.forEach((p,i)=>{
                expect(p._id.toString()).to.equal(postsMade[i]._id.toString());
              });
              done();
            })
        })
        .catch(err=>{
          console.log(err);
        });
    });
  });
  describe("Controllers Feed - createPost and editPost", function(){
    let feedControllerSeamed;
    beforeEach(function(){
      feedControllerSeamed = proxyquire("../controllers/feed",{"express-validator":{
        validationResult:()=>{
          return {
            isEmpty:()=>{
              return true
            }
          };
        }
      }}); 
    }); 
    describe("Controllers Feed - Validation failed",function(){
      beforeEach(function(){
        feedControllerSeamed = proxyquire("../controllers/feed",{"express-validator":{
          validationResult:()=>{
            return {
              isEmpty:()=>{
                return false;
              },
              array:()=>{
                return [];
              }
            };
          }
        }});
      });
      it("createPost - should throw an error if there is validation errors",function(done){
        shouldThrowError(feedControllerSeamed.createPost(req,{},next),done,422,"Validation failed",true);
      });
      it("editPost - should throw an error if there is validation errors",function(done){
        shouldThrowError(feedControllerSeamed.editPost(req,{},next),done,422,"Validation failed",true);
      });
    });
    describe("Controllers Feed - createPost", function(){
      it("should throw an error if the user is not found",function(done){
        req.userId = "9999aa99a9a99aa999a99a98";
        shouldThrowError(feedControllerSeamed.createPost(req, {},next),done,404,"User not found");
      });
      it("should get the response with correctly defined data", function(done){
        feedControllerSeamed.createPost(req, res, next)
          .then(({savedPost,updatedUser})=>{
            expect(res).to.include({"statusCode":201,"message":"New post was created","post":savedPost});
            expect(savedPost).to.include({"title":req.body.title,"content": req.body.content, "imageUrl": req.file.location, "creator":updatedUser});
            expect(updatedUser.posts[1].toString()).to.equal(savedPost._id.toString());
            done();
          })  
          .catch(err => console.log(err));
      });
    });
    describe("Controllers Feed - editPost", function(){
      it("should throw an error if the post is not found",function(done){
        req.params.postId = "8877aa99a9a99aa999a99a99";
        shouldThrowError(feedControllerSeamed.editPost(req, {}, next),done,404,"Post not found");
      });
      it("should throw an error if the user is not authorized",function(done){
        req.userId = "8877aa99a9a99aa999a99a88";
        shouldThrowError(feedControllerSeamed.editPost(req, {}, next),done,403,"Forbidden");
      });
      it("should call deleteFile if new img was uploaded", function(done){
        sinon.stub(fileHelper,"deleteFile");
        fileHelper.deleteFile.returns(true);
        feedControllerSeamed.editPost(req, res, next)
          .then(()=>{
            expect(fileHelper.deleteFile.called).to.be.true;
            fileHelper.deleteFile.restore();
            done();
          })
          .catch(err=>console.log(err));
      });
      it("should get the response with correctly defined data", function(done){
        feedControllerSeamed.editPost(req, res, next)
          .then((updatedPost)=>{
            expect(res).to.include({"statusCode":200,"message":"The post was updated","post":updatedPost});
            expect(updatedPost).to.include({"title":req.body.title,"content": req.body.content, "imageUrl": req.file.location});
            done();
          })  
          .catch(err => console.log(err));
      });
    });
  });
  describe("Controllers Feed - getPost", function(){
    it("should throw an error if the post is not found",function(done){
      req.params.postId = "8877aa99a9a99aa999a99a99";
      shouldThrowError(feedControllers.getPost(req, {}, next),done,404,"Post not found");
    });
    it("should get the response with correctly defined data", function(done){
      feedControllers.getPost(req, res, next)
        .then(post=>{
          expect(res).to.include({"statusCode":200,"message":"The post was fetched","post":post});
          done();
        })
        .catch(err=>{
          console.log(err);
        });
    });
  });
  describe("Controllers Feed - deletePost",function(){
    it("should throw an error if the post is not found",function(done){
      req.params.postId = "8877aa99a9a99aa999a99a99";
      shouldThrowError(feedControllers.deletePost(req, {}, next),done,404,"Post not found");
    });
    it("should throw an error if the user is not authorized",function(done){
      req.userId = "8877aa99a9a99aa999a99a88";
      shouldThrowError(feedControllers.deletePost(req, {}, next),done,403,"Forbidden");
    });
    describe("Controllers Feed - deletePost , the post was removed",function(){
      let postToDelete;
      beforeEach(function(done){
        postToDelete = new Post({
          title: "post test delete",
          imageUrl: "/someUrl/post",
          content: "some content for testing",
          creator: user._id,
          _id: "5555e8eee8e88888ee8ee8e8"
        });
        postToDelete.save()
          .then(createdPost=>{
            user.posts.push(createdPost);
            return user.save();
          })
          .then(()=>{
            req.userId = user._id;
            req.params.postId = postToDelete._id;
            done()
          })
          .catch(err=>{console.log(err)});
      });
      it("should call deleteFile if the post has img", function(done){
        req.imageUrl = "./testing/";
        sinon.stub(fileHelper,"deleteFile");
        fileHelper.deleteFile.returns(true);
        feedControllers.deletePost(req, res, next)
          .then(()=>{
            expect(fileHelper.deleteFile.called).to.be.true;
            fileHelper.deleteFile.restore();
            done();
          })
          .catch(err=>console.log(err));
      });
      it("should not find the deleted post in the db", function(done){
        feedControllers.deletePost(req, res, next)
          .then(({deletedPost})=>{
            expect(deletedPost._id.toString()).to.be.equal(req.params.postId.toString());
            return Post.findById(deletedPost._id);
          })  
          .then(removedPost=>{
            expect(removedPost).to.be.null;
            done();
          })
          .catch(err => console.log(err));
      });
      it("should not find the deleted post ref in the user model", function(done){
        feedControllers.deletePost(req, res, next)
          .then(({deletedPost,updatedUser})=>{
            expect(updatedUser._id.toString()).to.be.equal(req.userId.toString());
            expect(updatedUser.posts).to.not.contain(deletedPost._id);
            done();
          })
          .catch(err => console.log(err));
      });
      it("should get the response with correctly defined data", function(done){
        feedControllers.deletePost(req, res, next)
          .then(()=>{
            expect(res).to.include({"statusCode":200,"message":"The post was deleted"});
            done();
          })  
          .catch(err => console.log(err));
      });
    });
    
  });
  after(function(done){
    User.deleteMany({})
      .then(()=>{
        return Post.deleteMany({});
      })
      .then(()=>{
        return mongoose.disconnect();
      })
      .then(()=>{
        io.getIo.restore();
        done();
      })
      .catch(err =>{
        errorHandle.syncError(err);
      })
  });
});