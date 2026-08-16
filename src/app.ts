import cors = require("cors");
import express = require("express");
import errorHandler = require("./middleware/error.middleware");
import routes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1", routes);

app.use(errorHandler);

export = app;
