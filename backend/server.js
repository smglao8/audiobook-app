const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

/* ================= AUDIO FOLDER ================= */
const audioDir = path.join(__dirname, "audio");

if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
    console.log("📁 Created audio folder:", audioDir);
}

/* ================= SERVE AUDIO FILES ================= */
/* THIS IS WHAT MAKES PLAY + DOWNLOAD WORK */
app.use("/audio", express.static(audioDir));

/* ================= HOME TEST ================= */
app.get("/", (req, res) => {
    res.send("✅ Backend running. Audio system active.");
});

/* ================= AUDIO GENERATION (REAL FILES) ================= */
function createFakeAudioFile(filePath, text) {

    // This creates a VALID WAV file structure (not just text)
    const sampleRate = 22050;
    const duration = Math.max(1, Math.min(5, text.length / 20));
    const samples = sampleRate * duration;

    const buffer = Buffer.alloc(44 + samples * 2);

    // WAV HEADER
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + samples * 2, 4);
    buffer.write("WAVE", 8);
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(samples * 2, 40);

    // SIMPLE SOUND WAVE
    for (let i = 0; i < samples; i++) {
        const value = Math.sin(i / 10) * 32767;
        buffer.writeInt16LE(value, 44 + i * 2);
    }

    fs.writeFileSync(filePath, buffer);
}

/* ================= TTS ENDPOINT ================= */
app.post("/tts", (req, res) => {

    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "No text provided" });
    }

    const filename = Date.now() + ".wav";
    const filePath = path.join(audioDir, filename);

    createFakeAudioFile(filePath, text);

    const fileUrl = `http://localhost:${PORT}/audio/${filename}`;

    console.log("🎧 Generated:", fileUrl);

    res.json({
        file: fileUrl
    });
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
    console.log("🚀 Audiobook server running at http://localhost:" + PORT);
    console.log("📂 Audio folder:", audioDir);
});