const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");  // Import the Prisma client instance from the configuration file
const register = async (req, res) => {

    const { name, email, password } = req.body; // Destructure the name, email, and password from the request body or extract the name, email, and password from the request body

    const existingUser = await prisma.user.findUnique({   // It asks PostgreSQL: "Does anyone already have this email?"
        where: {
            email,
        },
    });

    if (existingUser) {  // if existingUser is not null, it means a user with this email already exists in the database , stop the functon and return a response to the client indicating that the user already exists.
        return res.status(400).json({
            success: false,
            message: "Email already exists",
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);  // password hashing

    const user = await prisma.user.create({  // Prisma → go to the User table → create a new row → insert this data → return the created row.
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

const login = async (req, res) => {

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
        {   // Create a JWT token with the user's ID and email as payload, signed with a secret key, and set to expire in 1 hour
            userId: user.id,
            email: user.email,
        },
        process.env.JWT_SECRET,  // secret key for signing the token, which is stored in an environment variable for security purposes
        {
            expiresIn: "1h",
        }
    );

    return res.status(200).json({
        success: true,
        message: "Login successful",
        token: token,
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    });
};

const getMe = (req, res) => {
    return res.status(200).json({
        success: true,
        data: req.user,   // req.user = decoded , means Return the authenticated user's information, which is stored in the req.user object after successful authentication
    });
};

module.exports = {

    register,
    login,
    getMe,

};