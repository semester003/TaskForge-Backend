import bcrypt = require("bcrypt");
import type { RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import jwt = require("jsonwebtoken");
import prisma = require("../config/prisma");
import { loginSchema, registerSchema } from "../validations/auth.validation";
import type { z } from "zod";

type RegisterRequestBody = z.infer<typeof registerSchema>;
type LoginRequestBody = z.infer<typeof loginSchema>;

const register: RequestHandler<ParamsDictionary, unknown, RegisterRequestBody> = async (
  req,
  res,
) => {
  const { name, email, password } = req.body;
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "Email already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
};

const login: RequestHandler<ParamsDictionary, unknown, LoginRequestBody> = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(400).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET as jwt.Secret,
    {
      expiresIn: "1h",
    },
  );

  return res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
};

const getMe: RequestHandler = (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
};

export { getMe, login, register };
