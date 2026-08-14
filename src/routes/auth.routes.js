const express = require("express");

const router = express.Router();

const validate = require("../middleware/validate.middleware");

const { registerSchema, loginSchema } = require("../validations/auth.validation");

const {
    register,
    login ,
    getMe,
} = require("../controllers/auth.controller");

const authenticate = require("../middleware/auth.middleware");


// routes 

router.post(
    "/register",
    validate(registerSchema),
    register
);

router.post(
    "/login",
    validate(loginSchema),
    login
);

router.get(
    "/me",
    authenticate,
    getMe
);

module.exports = router;