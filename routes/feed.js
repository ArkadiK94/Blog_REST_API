const express = require("express");
const {body} = require("express-validator");

const feedControllers = require("../controllers/feed");
const Auth = require("../middleware/is-auth");

const router = express.Router();

router.get("/posts", feedControllers.getPosts);

router.post("/post",Auth,
  [
    body("title").isLength({min:5}).trim(),
    body("content").isLength({min:5}).trim()
  ]
  , feedControllers.createPost
);

router.get("/post/:postId",Auth, feedControllers.getPost);

router.put("/post/:postId",Auth,
  [
    body("title").isLength({min:5}).trim(),
    body("content").isLength({min:5}).trim()
  ]
  , feedControllers.editPost
);

router.delete("/post/:postId", Auth, feedControllers.deletePost);

router.get("/status", Auth, feedControllers.getStatus);

router.put("/status", Auth, feedControllers.postStatus);

module.exports = router;