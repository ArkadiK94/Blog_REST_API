const express = require("express");
const {body} = require("express-validator");

const authController = require("../controllers/auth");

const router = express.Router();

router.post("/signup", 
  [
    body("email").isEmail().trim(),
    body("name").not().isEmpty().trim(),
    body("password").isLength({min:5}).trim()
  ],
  authController.postSignup
);

router.post("/login",authController.postLogin);

module.exports = router;