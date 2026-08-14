const { PrismaClient } = require("@prisma/client");  

const prisma = new PrismaClient(); // Create an instance of the PrismaClient to interact with the database , PrismaClient is a class that provides methods to perform database operations such as querying, creating, updating, and deleting records. It is generated based on the Prisma schema defined in the project. we make a object of PrismaClient class to use it in our application as prisma.

module.exports = prisma;  //Exports the same object to the whole project.