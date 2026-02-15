const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");
const crypto = require("crypto");

const app = express();
const PORT = 3000;

const UPLOAD_DIR = path.join(__dirname, "uploads");
fs.ensureDirSync(UPLOAD_DIR);

// 5MB limit
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

app.use(express.static("public"));

// 🔒 REAL IMAGE VALIDATION (MAGIC NUMBERS)
function isValidImage(buffer) {
    const signatures = {
        jpg: ["ffd8ff"],
        png: ["89504e47"],
        gif: ["47494638"],
        webp: ["52494646"]
    };

    const hex = buffer.toString("hex").slice(0, 8);

    return Object.values(signatures).some(sigArr =>
        sigArr.some(sig => hex.startsWith(sig))
    );
}

app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // 🔒 Type validation using real content
        if (!isValidImage(req.file.buffer)) {
            return res.status(400).json({ error: "Invalid file type. Only jpg, png, gif, webp allowed." });
        }

        // 🔒 Duplicate detection using SHA256
        const hash = crypto.createHash("sha256")
            .update(req.file.buffer)
            .digest("hex");

        const ext = path.extname(req.file.originalname);
        const filename = `${hash}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        if (await fs.pathExists(filepath)) {
            return res.json({ message: "Duplicate file detected. Reused existing file.", file: filename });
        }

        await fs.writeFile(filepath, req.file.buffer);

        res.json({ message: "File uploaded successfully", file: filename });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 🔒 Auto cleanup (24h)
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
}, 60 * 60 * 1000);

// 🔒 Proper error handling
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File too large. Maximum size is 5MB." });
        }
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
