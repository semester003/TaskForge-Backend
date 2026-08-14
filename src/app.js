const express = require("express");
const cors = require("cors");

const routes = require("./routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();

/*
    Middleware
*/

app.use(cors());

app.use(express.json());

/*
    Routes
*/

app.use("/api/v1", routes);

/*
    Global Error Handler
*/

app.use(errorHandler);

module.exports = app;