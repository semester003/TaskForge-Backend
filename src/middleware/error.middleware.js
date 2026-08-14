const { Prisma } = require("@prisma/client");

const errorHandler = (err, req, res, next) => {
    console.error(err);

    // Prisma - record not found
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Resource not found",
            });
        }

        // Prisma - unique constraint
        if (err.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "A record with this value already exists",
            });
        }

        // Prisma - foreign key constraint
        if (err.code === "P2003") {
            return res.status(400).json({
                success: false,
                message: "Invalid related resource",
            });
        }
    }

    // Default server error
    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};

module.exports = errorHandler;