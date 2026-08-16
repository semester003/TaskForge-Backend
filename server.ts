import "dotenv/config";
import app = require("./src/app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 TaskForge server running on port ${PORT}`);
});
