/** CODE COMMENTED BY COMMENTS4.ME ITSELF **/


const express = require('express'); // Imports the express library for creating the web server
const cors = require('cors'); // Imports the cors library for enabling Cross-Origin Resource Sharing
const multer = require('multer'); // Imports the multer library for handling file uploads
const path = require('path'); // Imports the path library for working with file paths
const { generateComments } = require('./ai-service'); // Imports the generateComments function from the ai-service module


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to enable CORS, JSON body parsing, and serving static files
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Configure multer for handling file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// JSONBin.io configuration - Replace with your actual API key and bin ID
const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;
const JSONBIN_BIN_ID = '68369a7a8a456b7966a64adb'; // Your Bin ID

console.log('🔧 JSONBin Configuration:');
console.log('📦 Bin ID:', JSONBIN_BIN_ID);
console.log('🔑 API Key:', JSONBIN_API_KEY ? 'Set ✅' : 'Missing ❌');

// Function to asynchronously retrieve the click counter from JSONBin.io
/**
 * Retrieves the current counter value from JSONBin.io.  Handles cases where the API key is missing.
 * @returns {number} The current counter value, or 0 if there's an error or no API key.
 */
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
      const count = data.record?.count || 0; // Use 0 as default if count is not found
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

// Function to asynchronously increment the click counter in JSONBin.io
/**
 * Increments the counter in JSONBin.io.  Falls back to a simple increment if the API key is missing.
 * @returns {number|null} The new counter value, or the old value if the update fails, or null if there's an error.
 */
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

// API endpoint to get the current counter value
/**
 * GET /api/counter: Returns the current click counter value.
 */
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

// API endpoint to process code and generate comments
/**
 * POST /api/generate-comments: Processes code, generates comments, and updates the counter.
 * Accepts code either as a file upload or in the request body.
 */
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
    
    // Increment counter after successful comment generation
    const newCount = await incrementCounter();
    
    console.log('✅ Code processing successful, new count:', newCount);
    
    // Return the commented code and the new count
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

// Test endpoint to manually increment the counter
/**
 * POST /api/test-counter: Test endpoint to manually increment the counter (for testing purposes).
 */
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
/**
 * GET /api/health: Returns the server's health status, current counter value, and timestamp.
 */
app.get('/api/health', async (req, res) => {
  const currentCount = await getCounter();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    currentCount,
    jsonbinConfigured: !!JSONBIN_API_KEY
  });
});

// Start the server and log startup messages including initial counter value
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
