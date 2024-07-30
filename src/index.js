const express = require("express");
const app = express();

app.use(express.json());

const router = require("./routes");
app.use("/api", router);

const PORT = 8000;

app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});
