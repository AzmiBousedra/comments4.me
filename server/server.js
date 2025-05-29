// server/server.js - JSONBin.io Version

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { generateComments } = require('./ai-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// JSONBin.io Configuration
const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;
const JSONBIN_BIN_ID = '68369a7a8a456b7966a64adb'; // Your Bin ID

console.log('🔧 JSONBin Configuration:');
console.log('📦 Bin ID:', JSONBIN_BIN_ID);
console.log('🔑 API Key:', JSONBIN_API_KEY ? 'Set ✅' : 'Missing ❌');

// Function to get counter from JSONBin
async function getCounter() {
  try {
    if (!JSONBIN_API_KEY) {
      console.log('⚠️ No JSONBin API key - using fallback counter');
      return 0;
    }

    console.log('📖 Reading counter from JSONBin...');
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': JSONBIN_API_KEY
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const count = data.record?.count || 0;
      console.log('📊 Counter loaded:', count);
      return count;
    } else {
      console.error('❌ JSONBin read failed:', response.status, response.statusText);
      return 0;
    }
  } catch (error) {
    console.error('❌ Error reading counter:', error.message);
    return 0;
  }
}

// Function to increment counter in JSONBin
async function incrementCounter() {
  try {
    if (!JSONBIN_API_KEY) {
      console.log('⚠️ No JSONBin API key - using fallback counter');
      return 1;
    }

    console.log('⬆️ Incrementing counter...');
    
    // Get current count
    const currentCount = await getCounter();
    const newCount = currentCount + 1;
    
    // Update counter in JSONBin
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY
      },
      body: JSON.stringify({
        count: newCount,
        lastUpdated: new Date().toISOString(),
        lastUsedFrom: 'Comments-4-Me-App'
      })
    });
    
    if (response.ok) {
      console.log('✅ Counter incremented to:', newCount);
      return newCount;
    } else {
      console.error('❌ JSONBin update failed:', response.status, response.statusText);
      return currentCount; // Return old count if update fails
    }
  } catch (error) {
    console.error('❌ Error incrementing counter:', error.message);
    return null;
  }
}

// API endpoint to get current counter value
app.get('/api/counter', async (req, res) => {
  console.log('🌐 GET /api/counter requested');
  try {
    const count = await getCounter();
    console.log('✅ Sending count:', count);
    res.json({ count });
  } catch (error) {
    console.error('❌ Counter API error:', error);
    res.status(500).json({ error: 'Failed to get counter' });
  }
});

// API endpoint for processing code with counter
app.post('/api/generate-comments', upload.single('codeFile'), async (req, res) => {
  console.log('🌐 POST /api/generate-comments requested');
  
  try {
    // Get code from file upload or request body
    const code = req.file 
      ? req.file.buffer.toString() 
      : req.body.code;
    
    const context = req.body.context || '';
    
    if (!code) {
      console.log('❌ No code provided');
      return res.status(400).json({ error: 'No code provided' });
    }
    
    console.log('🔄 Processing code file...');
    
    // Generate comments using the AI service
    const commentedCode = await generateComments(code, context);
    
    // Only increment counter after successful comment generation
    const newCount = await incrementCounter();
    
    console.log('✅ Code processing successful, new count:', newCount);
    
    // Return the commented code along with the new count
    res.json({ 
      commentedCode,
      clickCount: newCount 
    });
  } catch (error) {
    console.error('❌ Error generating comments:', error);
    res.status(500).json({ 
      error: 'Failed to generate comments',
      details: error.message 
    });
  }
});

// Test endpoint to manually increment counter (for testing)
app.post('/api/test-counter', async (req, res) => {
  console.log('🧪 Test counter endpoint called');
  try {
    const newCount = await incrementCounter();
    res.json({ 
      message: 'Counter incremented for testing',
      newCount 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to increment counter' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const currentCount = await getCounter();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    currentCount,
    jsonbinConfigured: !!JSONBIN_API_KEY
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('📊 Using JSONBin.io for persistent counter storage');
  
  // Test the counter on startup
  if (JSONBIN_API_KEY) {
    getCounter().then(count => {
      console.log(`🎯 Current counter value: ${count}`);
    }).catch(err => {
      console.error('❌ Failed to load initial counter:', err.message);
    });
  }
});
