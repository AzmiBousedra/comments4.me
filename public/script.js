// public/script.js

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const fileName = document.getElementById('file-name');
    const originalCode = document.getElementById('original-code');
    const commentedCode = document.getElementById('commented-code');
    const contextInput = document.getElementById('context-input');
    const processBtn = document.getElementById('process-btn');
    const downloadBtn = document.getElementById('download-btn');
    const copyBtn = document.getElementById('copy-btn');
    const loadingIndicator = document.getElementById('loading');
    
    // Current file reference
    let currentFile = null;
    
    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
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
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });
    
    // Process files
    function handleFiles(files) {
        if (files.length > 0) {
            currentFile = files[0];
            fileName.textContent = currentFile.name;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                displayCode(content);
                processBtn.disabled = false;
            };
            console.log("Code Successfully Imported");
            reader.readAsText(currentFile);
        }
    }
    
    // Get language from file extension
    function getLanguageFromFileName(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'java': 'java',
            'html': 'html',
            'css': 'css',
            'cpp': 'cpp',
            'c': 'c',
            'php': 'php',
            'sql': 'sql',
            'json': 'json',
            'jsx': 'jsx',
            'tsx': 'tsx'
        };
        
        return languageMap[extension] || 'none';
    }
    
    // Display code in the original code section with syntax highlighting
    function displayCode(content) {
        // Set the content
        originalCode.textContent = content;
        
        // Set the language class based on file extension
        if (currentFile) {
            const language = getLanguageFromFileName(currentFile.name);
            originalCode.className = `language-${language}`;
        }
        
        // Apply Prism highlighting
        Prism.highlightElement(originalCode);
    }
    
    // Process button click handler
    processBtn.addEventListener('click', processCode);
    
    // Process code function - connects to the backend API
    async function processCode() {
        if (!originalCode.textContent.trim()) {
            alert('Please upload a code file first');
            return;
        }
        
        // Show loading indicator
        loadingIndicator.style.display = 'flex';
        
        try {
            // Create form data for the API call
            const formData = new FormData();
            
            // If we have a file, add it to the form data
            if (currentFile) {
                formData.append('codeFile', currentFile);
            } else {
                // Otherwise, send the code as text
                formData.append('code', originalCode.textContent);
            }
            
            // Add context if provided
            formData.append('context', contextInput.value);
            
            // Call the API
            const response = await fetch('/api/generate-comments', {
                method: 'POST',
                body: formData,
            });
            
            // Check if the response is OK
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate comments');
            }
            
            // Parse the response
            const data = await response.json();
            
            // Display the commented code with syntax highlighting
            commentedCode.textContent = data.commentedCode;
            
            // Set the language class based on file extension
            if (currentFile) {
                const language = getLanguageFromFileName(currentFile.name);
                commentedCode.className = `language-${language}`;
            }
            
            // Apply Prism highlighting
            Prism.highlightElement(commentedCode);
            
            // Enable download and copy buttons
            downloadBtn.disabled = false;
            copyBtn.disabled = false;
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred: ' + error.message);
        } finally {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
        }
    }
    
    // Download button click handler
    downloadBtn.addEventListener('click', downloadCommentedCode);
    
    // Download function
    function downloadCommentedCode() {
        const content = commentedCode.textContent;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const extension = currentFile ? getFileExtension(currentFile.name) : '.txt';
        const originalName = currentFile ? currentFile.name.replace(extension, '') : 'code';
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${originalName}-commented${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("Downloaded Code");
    }
    
    // Copy button click handler
    copyBtn.addEventListener('click', copyCommentedCode);
    
    // Copy function
    function copyCommentedCode() {
        const content = commentedCode.textContent;
        
        // Use the Clipboard API to copy the text
        navigator.clipboard.writeText(content)
            .then(() => {
                // Provide visual feedback that the copy was successful
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                copyBtn.classList.add('copied');
                console.log("Copied Code");
                
                // Reset button text after a short delay
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Failed to copy to clipboard');
            });
    }
    
    // Helper function to get file extension
    function getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 1);
    }
});