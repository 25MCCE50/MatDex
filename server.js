const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const PORT = 3000;

const PRIMARY_KEY = process.env.NVIDIA_API_KEY_PRIMARY;
const SECONDARY_KEY = process.env.NVIDIA_API_KEY_SECONDARY;

// Helper: make a streaming chat request with a given API key
async function makeChatRequest(apiKey, messages) {
    return fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
            model: "meta/llama-3.1-70b-instruct",
            messages,
            max_tokens: 1024,
            temperature: 0.2,
            stream: true
        })
    });
}

app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required' });

    if (!PRIMARY_KEY && !SECONDARY_KEY) {
        return res.status(500).json({ error: 'No NVIDIA API keys configured in .env file.' });
    }

    // Fast local rejection
    const offTopicKeywords = ['recipe', 'cook', 'sports', 'politics', 'movie', 'weather', 'president', 'celebrity', 'game', 'music', 'song'];
    if (offTopicKeywords.some(kw => message.toLowerCase().includes(kw))) {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
        res.write(`data: ${JSON.stringify({ content: "I am a specialized Material Science assistant. I can only answer questions related to materials, structures, and engineering properties." })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
    }

    const systemPrompt = {
        role: "system",
        content: "You are a professional Materials Science Professor. You are strictly limited to answering questions related to material science (materials, structures, processes, engineering properties, etc.). Make sure to give detailed explanations of what is asked, and ensure this AI generated data is accurate without mistakes. If a user query is not directly related to materials science, you MUST reject it by responding EXACTLY with: 'I am a specialized Material Science assistant. I can only answer questions related to materials, structures, and engineering properties.'"
    };

    const messages = [systemPrompt, ...(history || []), { role: "user", content: message }];

    // Try primary key, fall back to secondary
    let response = null;
    let usedKey = 'primary';

    if (PRIMARY_KEY) {
        response = await makeChatRequest(PRIMARY_KEY, messages);
        if (!response.ok) {
            const errText = await response.text();
            console.warn(`Primary key failed (${response.status}): ${errText.substring(0, 100)}`);
            response = null;
        }
    }

    if (!response && SECONDARY_KEY) {
        usedKey = 'secondary';
        response = await makeChatRequest(SECONDARY_KEY, messages);
        if (!response.ok) {
            const errText = await response.text();
            console.error(`Secondary key also failed (${response.status}): ${errText.substring(0, 100)}`);
            return res.status(429).json({ error: 'Both API keys have exceeded their quota or encountered an error. Please try again later.' });
        }
    }

    if (!response) {
        return res.status(500).json({ error: 'No valid API key available.' });
    }

    console.log(`Chat request served using ${usedKey} API key.`);

    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });

    try {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const parsed = JSON.parse(line.substring(6));
                        if (parsed.choices?.[0]?.delta?.content) {
                            res.write(`data: ${JSON.stringify({ content: parsed.choices[0].delta.content })}\n\n`);
                        }
                    } catch (e) { /* skip partial */ }
                }
            }
        }
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error('Streaming error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
    }
});

app.listen(PORT, () => {
    console.log(`MatDex Backend running at http://localhost:${PORT}`);
    console.log(`Primary key: ${PRIMARY_KEY ? 'configured' : 'MISSING'}`);
    console.log(`Secondary key: ${SECONDARY_KEY ? 'configured' : 'MISSING'}`);
});
