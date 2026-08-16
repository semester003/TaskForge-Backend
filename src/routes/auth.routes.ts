import express = require("express");
import { getMe, login, register } from "../controllers/auth.controller";
import authenticate = require("../middleware/auth.middleware");
import validate = require("../middleware/validate.middleware");
import { loginSchema, registerSchema } from "../validations/auth.validation";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", authenticate, getMe);

export = router;
