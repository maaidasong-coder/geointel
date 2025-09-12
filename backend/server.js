import express from "express";
import cors from "cors";
import routes from "./routes.js";

const app = express();
app.use(cors());
app.use(express.json());

// mount routes under /api
app.use("/api/v1", routes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("API running on port", PORT));
