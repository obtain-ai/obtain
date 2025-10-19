// api/chat.js
import express from 'express';
import OpenAI from 'openai';

const app = express();
const openai = new OpenAI({
  apiKey: process.env.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 // Only on server
});

app.post('/api/chat', async (req, res) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: req.body.messages
    });
    
    res.json({ content: response.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: 'API call failed' });
  }
});
