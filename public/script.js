/** CODE COMMENTED BY COMMENTS4.ME ITSELF **/



// Function to asynchronously fetch and display the code files commented counter
async function loadCounter() {
  try {
    // Fetch the counter value from the server
    const response = await fetch('/api/counter');
    // Throw an error if the response is not ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // Parse the JSON response
    const data = await response.json();
    
    // Get the catchline element
    const catchlineElement = document.getElementById('catchline');
    // Check if the element exists
    if (catchlineElement) {
      // Update the catchline based on the counter value
      if (data.count > 0) {
        // Add green styling to the number of commented code files
        catchlineElement.innerHTML = `// <span class="count-number">${data.count}</span> code files commented`;
      } else {
        catchlineElement.textContent = '// Upload your code and get AI-generated comments';
      }
    }
  } catch (error) {
    console.error('Error loading counter:', error);
    // Get the catchline element
    const catchlineElement = document.getElementById('catchline');
    // Check if the element exists
    if (catchlineElement) {
      // Display default text if an error occurs
      catchlineElement.textContent = '// Upload your code and get AI-generated comments';
    }
  }
}

// Function to update the catchline with a new count
function updateCatchline(count) {
  // Get the catchline element
  const catchlineElement = document.getElementById('catchline');
  // Check if the element and count exist
  if (catchlineElement && count) {
    // Add green styling to the number of commented code files
    catchlineElement.innerHTML = `// <span class="count-number">${count}</span> code files commented`;
  }
}

// Class to represent a file (optional, depends on the overall application design)
// This could be expanded for more complex file handling needs.  Example:
// class FileHandler {
//   constructor(file) { this.file = file; }
//   // ... methods for file processing ...
// }


// Define DOM elements for easier access and manipulation
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const processBtn = document.getElementById('process-btn');
const originalCode = document.getElementById('original-code');
const commentedCode = document.getElementById('commented-code');
const contextInput = document.getElementById('context-input');
const loadingIndicator = document.getElementById('loading');
const fileName = document.getElementById('file-name');
const downloadBtn = document.getElementById('download-btn');
const copyBtn = document.getElementById('copy-btn');

let selectedFile = null; // Variable to store the selected file
let currentFileName = ''; // Variable to store the current file name

// Prevent default drag-and-drop behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

// Helper function to prevent default drag behaviors
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop area when file is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

// Remove highlight when file is dragged out
['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

// Function to add highlight class
function highlight(e) {
    dropArea.classList.add('highlight');
}

// Function to remove highlight class
function unhighlight(e) {
    dropArea.classList.remove('highlight');
}

// Handle file drop event
dropArea.addEventListener('drop', handleDrop, false);

// Function to handle dropped files
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

// Handle file input change event
fileInput.addEventListener('change', function(e) {
    handleFiles(e.target.files);
});

// Function to process the selected files
function handleFiles(files) {
    // Check if any files were selected
    if (files.length > 0) {
        selectedFile = files[0];
        currentFileName = selectedFile.name;
        fileName.textContent = `Selected: ${currentFileName}`;
        
        // Create a new FileReader object
        const reader = new FileReader();
        // Read the file as text
        reader.onload = function(e) {
            // Get the file content
            const code = e.target.result;
            // Display the original code
            originalCode.textContent = code;
            originalCode.classList.remove('placeholder');
            
            // Detect the programming language
            const language = detectLanguage(currentFileName);
            // Apply syntax highlighting
            originalCode.className = `language-${language}`;
            
            // Apply Prism highlighting if available
            if (typeof Prism !== 'undefined') {
                Prism.highlightElement(originalCode);
            }
        };
        reader.readAsText(selectedFile);
        
        // Enable process button
        processBtn.disabled = false;
    }
}

// Function to detect programming language based on file extension
function detectLanguage(filename) {
    // Get the file extension
    const extension = filename.split('.').pop().toLowerCase();
    // Map extensions to language names
    const languageMap = {
        js: 'javascript',
        py: 'python',
        java: 'java',
        html: 'html',
        css: 'css',
        cpp: 'cpp',
        c: 'c',
        php: 'php'
    };
    // Return language name or default to javascript
    return languageMap[extension] || 'javascript';
}

//Process button click handler
processBtn.addEventListener('click', async function() {
    //If no file selected, exit
    if (!selectedFile) return;
    
    // Show loading indicator
    loadingIndicator.style.display = 'flex';
    processBtn.disabled = true;
    
    try {
        // Create FormData object
        const formData = new FormData();
        // Append code file and context to FormData object
        formData.append('codeFile', selectedFile);
        formData.append('context', contextInput.value);
        
        // Send POST request to generate comments
        const response = await fetch('/api/generate-comments', {
            method: 'POST',
            body: formData
        });
        
        // Parse JSON response
        const result = await response.json();
        
        // Check if request was successful
        if (response.ok) {
            // Display the commented code
            commentedCode.textContent = result.commentedCode;
            commentedCode.classList.remove('placeholder');
            
            // Apply syntax highlighting
            const language = detectLanguage(currentFileName);
            commentedCode.className = `language-${language}`;
            
            // Apply Prism highlighting if available
            if (typeof Prism !== 'undefined') {
                Prism.highlightElement(commentedCode);
            }
            
            // Enable download and copy buttons
            downloadBtn.disabled = false;
            copyBtn.disabled = false;
            
            // Update catchline with new count
            if (result.clickCount) {
                updateCatchline(result.clickCount);
            }
            
            console.log('Comments generated successfully. New count:', result.clickCount);
            
        } else {
            // Throw error if request failed
            throw new Error(result.error || 'Failed to generate comments');
        }
        
    } catch (error) {
        console.error('Error generating comments:', error);
        
        // Show error message to user
        const errorMessage = error.message || 'An unexpected error occurred';
        alert('Error: ' + errorMessage);
        
        // Reset commented code area
        commentedCode.textContent = '// Error generating comments. Please try again.';
        commentedCode.classList.add('placeholder');
        
    } finally {
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
        processBtn.disabled = false;
    }
});

// Download button click handler
downloadBtn.addEventListener('click', function() {
    // Check if commented code exists and is not a placeholder
    if (commentedCode.textContent && !commentedCode.classList.contains('placeholder')) {
        try {
            // Create a Blob from commented code
            const blob = new Blob([commentedCode.textContent], { type: 'text/plain' });
            // Create a URL for the Blob
            const url = URL.createObjectURL(blob);
            // Create a temporary anchor element
            const a = document.createElement('a');
            // Set anchor element attributes
            a.href = url;
            a.download = `commented_${currentFileName}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('File downloaded:', `commented_${currentFileName}`);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed. Please try again.');
        }
    }
});

// Copy button click handler
copyBtn.addEventListener('click', async function() {
    // Check if commented code exists and is not a placeholder
    if (commentedCode.textContent && !commentedCode.classList.contains('placeholder')) {
        try {
            // Copy text to clipboard
            await navigator.clipboard.writeText(commentedCode.textContent);
            
            // Provide visual feedback
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.classList.remove('copied');
            }, 2000);
            
            console.log('Code copied to clipboard');
            
        } catch (err) {
            console.error('Failed to copy text:', err);
            
            // Fallback for older browsers
            try {
                // Create a temporary textarea element
                const textArea = document.createElement('textarea');
                textArea.value = commentedCode.textContent;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                // Provide visual feedback
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                copyBtn.classList.add('copied');
                
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
                
            } catch (fallbackErr) {
                console.error('Fallback copy failed:', fallbackErr);
                alert('Failed to copy to clipboard. Please select and copy manually.');
            }
        }
    }
});

// Function to reset the application state
function resetApp() {
    selectedFile = null;
    currentFileName = '';
    fileName.textContent = '';
    
    // Reset code areas
    originalCode.textContent = '// Your code will appear here';
    originalCode.classList.add('placeholder');
    originalCode.className = 'language-none placeholder';
    
    commentedCode.textContent = '// Commented code will appear here';
    commentedCode.classList.add('placeholder');
    commentedCode.className = 'language-none placeholder';
    
    // Reset context input
    contextInput.value = '';
    
    // Disable buttons
    processBtn.disabled = true;
    downloadBtn.disabled = true;
    copyBtn.disabled = true;
    
    // Reset file input
    fileInput.value = '';
}

// Keyboard shortcuts for processing and resetting the app
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to process
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!processBtn.disabled) {
            processBtn.click();
        }
    }
    
    // Ctrl/Cmd + R to reset
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault(); // Prevent default page reload
        resetApp();
    }
});

// Event listeners for online and offline status
window.addEventListener('online', function() {
    console.log('Network connection restored');
});

window.addEventListener('offline', function() {
    console.log('Network connection lost');
    alert('Network connection lost. Please check your internet connection.');
});

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Comments 4 me app initialized');
    
    // Load the counter on startup
    loadCounter();
    
    //Check for missing elements
    const requiredElements = [
        'drop-area', 'file-input', 'process-btn', 'original-code', 
        'commented-code', 'context-input', 'loading', 'file-name', 
        'download-btn', 'copy-btn', 'catchline'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
    }
    
    // Set tooltips for buttons (optional)
    processBtn.title = 'Generate AI comments for your code (Ctrl+Enter)';
    downloadBtn.title = 'Download commented code file';
    copyBtn.title = 'Copy commented code to clipboard';
    
    console.log('App initialization complete');
});
