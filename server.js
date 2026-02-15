const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");
const crypto = require("crypto");

const app = express();
const PORT = 3000;

const UPLOAD_DIR = path.join(__dirname, "uploads");
fs.ensureDirSync(UPLOAD_DIR);

// Allowed types
const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// Multer config
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Only image files are allowed (jpg, png, gif, webp)"));
        }
        cb(null, true);
    }
});

// Serve frontend
app.use(express.static("public"));

// Upload endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Create hash for duplicate detection
        const hash = crypto.createHash("sha256")
            .update(req.file.buffer)
            .digest("hex");

        const ext = path.extname(req.file.originalname);
        const filename = `${hash}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        // If duplicate exists, don't rewrite
        if (await fs.pathExists(filepath)) {
            return res.json({ message: "Duplicate file detected. Reused existing file.", file: filename });
        }

        await fs.writeFile(filepath, req.file.buffer);

        res.json({ message: "File uploaded successfully", file: filename });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Auto cleanup (older than 24h)
setInterval(async () => {
    const files = await fs.readdir(UPLOAD_DIR);
    const now = Date.now();

    for (const file of files) {
        const filePath = path.join(UPLOAD_DIR, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > 24 * 60 * 60 * 1000) {
            await fs.remove(filePath);
            console.log("Deleted old file:", file);
        }
    }
}, 60 * 60 * 1000); // Check every hour

// Error handler
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
    }
    if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});

app.listen(PORT, () => {
    console.log(`Secure File Upload running at http://localhost:${PORT}`);
});
