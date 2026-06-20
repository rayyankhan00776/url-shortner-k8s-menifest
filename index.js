require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const shortid = require("shortid");
const path = require("path");

const app = express();

// =======================
// MongoDB Connection
// =======================
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.log(err));

// =======================
// Schema
// =======================
const urlSchema = new mongoose.Schema(
    {
        originalUrl: {
            type: String,
            required: true,
        },
        shortCode: {
            type: String,
            required: true,
            unique: true,
        },
    },
    {
        timestamps: true,
    }
);

const Url = mongoose.model("Url", urlSchema);

// =======================
// Middleware
// =======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// =======================
// Home Route
// =======================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// =======================
// Create Short URL
// =======================
app.post("/shorten", async (req, res) => {
    try {
        const { originalUrl } = req.body;

        if (!originalUrl) {
            return res.status(400).json({
                success: false,
                message: "URL is required",
            });
        }

        let existing = await Url.findOne({ originalUrl });

        if (existing) {
            return res.json({
                success: true,
                shortUrl: `${process.env.BASE_URL}/${existing.shortCode}`,
            });
        }

        const shortCode = shortid.generate();

        const newUrl = await Url.create({
            originalUrl,
            shortCode,
        });

        res.json({
            success: true,
            shortUrl: `${process.env.BASE_URL}/${newUrl.shortCode}`,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
});

// =======================
// Redirect Route
// =======================
app.get("/:code", async (req, res) => {
    try {
        const url = await Url.findOne({
            shortCode: req.params.code,
        });

        if (!url) {
            return res.status(404).send("URL Not Found");
        }

        res.redirect(url.originalUrl);
    } catch (error) {
        res.status(500).send("Server Error");
    }
});

// =======================
// Server
// =======================
app.listen(process.env.PORT, () => {
    console.log(
        `🚀 Server running on port ${process.env.PORT}`
    );
});