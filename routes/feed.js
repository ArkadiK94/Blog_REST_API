const express = require("express");
const {body} = require("express-validator");

const feedControllers = require("../controllers/feed");

const router = express.Router();

router.get("/posts", feedControllers.getPosts);

router.post("/post",
  [
    body("title").isLength({min:5}).trim(),
    body("content").isLength({min:5}).trim()
  ]
  , feedControllers.createPost
);

router.get("/post/:postId", feedControllers.getPost);

router.put("/post/:postId",
  [
    body("title").isLength({min:5}).trim(),
    body("content").isLength({min:5}).trim()
  ]
  , feedControllers.editPost
);

router.delete("/post/:postId", feedControllers.deletePost);




module.exports = router;