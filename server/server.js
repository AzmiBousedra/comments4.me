// server/server.js

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { generateComments } = require('./ai-service');

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// API endpoint for processing code
app.post('/api/generate-comments', upload.single('codeFile'), async (req, res) => {
  try {
    // Get code from file upload or request body
    const code = req.file 
      ? req.file.buffer.toString() 
      : req.body.code;
    
    const context = req.body.context || '';
    
    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }
    
    // Generate comments using the AI service
    const commentedCode = await generateComments(code, context);
    
    // Return the commented code
    res.json({ commentedCode });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate comments',
      details: error.message 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});