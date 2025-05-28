// server/server.js - Complete version with click counter

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
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

// Path for the counter file
const COUNTER_FILE = path.join(__dirname, 'data', 'counter.json');

// Initialize counter file and directory
async function initializeCounter() {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(COUNTER_FILE);
    await fs.mkdir(dataDir, { recursive: true });
    
    // Check if counter file exists
    try {
      await fs.access(COUNTER_FILE);
      console.log('Counter file found');
    } catch {
      // File doesn't exist, create it with initial count
      await fs.writeFile(COUNTER_FILE, JSON.stringify({ 
        count: 0, 
        lastUpdated: new Date().toISOString(),
        startDate: new Date().toISOString()
      }, null, 2));
      console.log('Counter file initialized with count: 0');
    }
  } catch (error) {
    console.error('Error initializing counter:', error);
  }
}

// Function to increment and get counter
async function incrementCounter() {
  try {
    // Read current count
    const data = await fs.readFile(COUNTER_FILE, 'utf8');
    const counterData = JSON.parse(data);
    
    // Increment count
    counterData.count += 1;
    counterData.lastUpdated = new Date().toISOString();
    
    // Write back to file
    await fs.writeFile(COUNTER_FILE, JSON.stringify(counterData, null, 2));
    
    console.log(`Counter incremented to: ${counterData.count}`);
    return counterData.count;
  } catch (error) {
    console.error('Error incrementing counter:', error);
    return null;
  }
}

// Function to get current counter value
async function getCounter() {
  try {
    const data = await fs.readFile(COUNTER_FILE, 'utf8');
    const counterData = JSON.parse(data);
    return counterData.count;
  } catch (error) {
    console.error('Error reading counter:', error);
    return 0;
  }
}

// API endpoint to get current counter value
app.get('/api/counter', async (req, res) => {
  try {
    const count = await getCounter();
    res.json({ count });
  } catch (error) {
    console.error('Counter API error:', error);
    res.status(500).json({ error: 'Failed to get counter' });
  }
});

// API endpoint for processing code with counter
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
    
    console.log('Processing code file...');
    
    // Generate comments using the AI service
    const commentedCode = await generateComments(code, context);
    
    // Only increment counter after successful comment generation
    const newCount = await incrementCounter();
    
    console.log('Code processing successful');
    
    // Return the commented code along with the new count
    res.json({ 
      commentedCode,
      clickCount: newCount 
    });
  } catch (error) {
    console.error('Error generating comments:', error);
    res.status(500).json({ 
      error: 'Failed to generate comments',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize counter on startup
initializeCounter().then(() => {
  console.log('Counter system initialized');
}).catch(err => {
  console.error('Failed to initialize counter:', err);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Counter file location: ${COUNTER_FILE}`);
});
