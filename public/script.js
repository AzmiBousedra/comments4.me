// public/script.js - Complete version with counter integration

// Function to load and display current counter
async function loadCounter() {
  try {
    const response = await fetch('/api/counter');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Update the catchline with the counter
    const catchlineElement = document.getElementById('catchline');
    if (catchlineElement) {
      if (data.count > 0) {
        catchlineElement.textContent = `// ${data.count} code files commented`;
      } else {
        catchlineElement.textContent = '// Upload your code and get AI-generated comments';
      }
    }
  } catch (error) {
    console.error('Error loading counter:', error);
    // Keep default text if error
    const catchlineElement = document.getElementById('catchline');
    if (catchlineElement) {
      catchlineElement.textContent = '// Upload your code and get AI-generated comments';
    }
  }
}

// Function to update catchline with new count
function updateCatchline(count) {
  const catchlineElement = document.getElementById('catchline');
  if (catchlineElement && count) {
    catchlineElement.textContent = `// ${count} code files commented`;
  }
}

// DOM elements
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

let selectedFile = null;
let currentFileName = '';

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop area when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropArea.classList.add('highlight');
}

function unhighlight(e) {
    dropArea.classList.remove('highlight');
}

// Handle dropped files
dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

// Handle file input change
fileInput.addEventListener('change', function(e) {
    handleFiles(e.target.files);
});

// Process selected files
function handleFiles(files) {
    if (files.length > 0) {
        selectedFile = files[0];
        currentFileName = selectedFile.name;
        fileName.textContent = `Selected: ${currentFileName}`;
        
        // Read and display the original code
        const reader = new FileReader();
        reader.onload = function(e) {
            const code = e.target.result;
            originalCode.textContent = code;
            originalCode.classList.remove('placeholder');
            
            // Detect language and apply syntax highlighting
            const language = detectLanguage(currentFileName);
            originalCode.className = `language-${language}`;
            
            // Apply Prism highlighting if Prism is loaded
            if (typeof Prism !== 'undefined') {
                Prism.highlightElement(originalCode);
            }
        };
        reader.readAsText(selectedFile);
        
        processBtn.disabled = false;
    }
}

// Detect programming language from file extension
function detectLanguage(filename) {
    const extension = filename.split('.').pop().toLowerCase();
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
    return languageMap[extension] || 'javascript';
}

// Process button click handler with counter update
processBtn.addEventListener('click', async function() {
    if (!selectedFile) return;
    
    // Show loading indicator
    loadingIndicator.style.display = 'flex';
    processBtn.disabled = true;
    
    try {
        const formData = new FormData();
        formData.append('codeFile', selectedFile);
        formData.append('context', contextInput.value);
        
        const response = await fetch('/api/generate-comments', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Display the commented code
            commentedCode.textContent = result.commentedCode;
            commentedCode.classList.remove('placeholder');
            
            // Apply syntax highlighting
            const language = detectLanguage(currentFileName);
            commentedCode.className = `language-${language}`;
            
            // Apply Prism highlighting if Prism is loaded
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

// Download functionality
downloadBtn.addEventListener('click', function() {
    if (commentedCode.textContent && !commentedCode.classList.contains('placeholder')) {
        try {
            const blob = new Blob([commentedCode.textContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
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

// Copy functionality
copyBtn.addEventListener('click', async function() {
    if (commentedCode.textContent && !commentedCode.classList.contains('placeholder')) {
        try {
            await navigator.clipboard.writeText(commentedCode.textContent);
            
            // Visual feedback
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
                const textArea = document.createElement('textarea');
                textArea.value = commentedCode.textContent;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                // Visual feedback
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

// Reset functionality
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

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to process
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!processBtn.disabled) {
            processBtn.click();
        }
    }
    
    // Ctrl/Cmd + R to reset (prevent default page reload)
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        resetApp();
    }
});

// Error handling for network issues
window.addEventListener('online', function() {
    console.log('Network connection restored');
});

window.addEventListener('offline', function() {
    console.log('Network connection lost');
    alert('Network connection lost. Please check your internet connection.');
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Comments 4 me app initialized');
    
    // Load counter on startup
    loadCounter();
    
    // Check if all required elements exist
    const requiredElements = [
        'drop-area', 'file-input', 'process-btn', 'original-code', 
        'commented-code', 'context-input', 'loading', 'file-name', 
        'download-btn', 'copy-btn', 'catchline'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
    }
    
    // Initialize tooltips or help text if needed
    processBtn.title = 'Generate AI comments for your code (Ctrl+Enter)';
    downloadBtn.title = 'Download commented code file';
    copyBtn.title = 'Copy commented code to clipboard';
    
    console.log('App initialization complete');
});
