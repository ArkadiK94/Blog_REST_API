require("dotenv").config();

const expect = require("chai").expect;
const proxyquire = require("proxyquire").noPreserveCache();
const mongoose = require("mongoose");

const User = require("../model/user");
const Post = require("../model/post"); 
const feedControllers = require("../controllers/feed");

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
        done();
      })
      .catch(err =>{
        errorHandle.syncError(err);
      });
  });
  beforeEach(function(){
    req = {
      body:{
        email: "test2@test.com",
        password: "xyz",
        name: "test",
        status: "Testing"
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
    it("should return an error in case there was one",function(done){
      feedControllers.getPosts(req,{},()=>{})
        .then(result=>{
          expect(result)
            .to.be.an("error");
          done();
        })
        .catch(err =>{
          expect(err)
            .to.be.an("error");
          done();
        });
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
          feedControllers.getPosts(req,res,()=>{})  
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
  describe("Controllers Feed - Validation failed",function(){
    let chackingStatus = (promise,done)=>{
      promise
        .then(result=> {
          expect(result)
            .to.be.an("error")
            .to.include({"message":"Validation failed","httpStatusCode":422})
            .to.have.property("data");
          done();
        })
        .catch(err => {
          expect(err)
            .to.be.an("error")
            .to.include({"message":"Validation failed","httpStatusCode":422})
            .to.have.property("data");
          done();
        });
    };
    before(function(){
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
    it("createPost - should throw error if there is validation errors",function(done){
      chackingStatus(feedControllerSeamed.createPost({},{},()=>{}),done);
    });
    it("editPost - should throw error if there is validation errors",function(done){
      chackingStatus(feedControllerSeamed.editPost({},{},()=>{}),done);
    });
  });
  describe("Controllers Feed - createPost and editPost", function(done){
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
        done();
      })
      .catch(err =>{
        errorHandle.syncError(err);
      })
  });
});