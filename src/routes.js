const express = require("express");
const router = express.Router();
const {v4: uuidv4} = require("uuid");
const { executeCodeInSandbox } = require('./sandbox/executeCode');
const {supportedLanguages} = require("./languages");

router.get("/languages", async (req, res) => {
    res.json({supportedLanguages});
})

router.post("/execute", async (req, res) => {
    const { language, code } = req.body;
    if (!language || !code ){
        return res.status(400).json({ error: 'Language and code are required.' });
    }

    try {
        const executionId = uuidv4();
        const startTime = new Date();

        const result = await executeCodeInSandbox(language, code);
        console.log(result)

        const endTime = new Date();

        const executionTime = endTime - startTime;

        res.json({
            executionId,
            output: result.output || "",
            error: result.error || "",
            startTime: startTime.toISOString(),
            executionTime: `${executionTime} ms`,
            linesOfCode: code.split('\n').length,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to execute code.', details: error.message });
    }
})

module.exports = router;