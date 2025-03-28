document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const inputText = document.getElementById('inputText');
    const summaryText = document.getElementById('summaryText');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const loadSampleBtn = document.getElementById('loadSampleBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const saveBtn = document.getElementById('saveBtn');
    const pasteBtn = document.getElementById('pasteBtn');
    const summaryLengthSlider = document.getElementById('summaryLengthSlider');
    const summaryLengthValue = document.getElementById('summaryLengthValue');
    const importanceThresholdSlider = document.getElementById('importanceThresholdSlider');
    const importanceThresholdValue = document.getElementById('importanceThresholdValue');
    const inputWordCount = document.getElementById('inputWordCount');
    const summaryWordCount = document.getElementById('summaryWordCount');
    const statsDisplay = document.getElementById('statsDisplay');
    const statusElement = document.getElementById('statusText');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // Update word count for input text
    function updateInputWordCount() {
        const text = inputText.value.trim();
        const wordCount = text ? text.split(/\s+/).length : 0;
        inputWordCount.textContent = `Words: ${wordCount}`;
    }
    
    // Add input event listener to count words
    inputText.addEventListener('input', updateInputWordCount);
    
    // Update slider values
    summaryLengthSlider.addEventListener('input', function() {
        summaryLengthValue.textContent = `${this.value}%`;
    });
    
    importanceThresholdSlider.addEventListener('input', function() {
        const value = (this.value / 10).toFixed(1);
        importanceThresholdValue.textContent = value;
    });
    
    // Clear text
    clearBtn.addEventListener('click', function() {
        inputText.value = '';
        summaryText.innerHTML = '';
        statsDisplay.innerHTML = '<p>No statistics available yet.</p>';
        updateInputWordCount();
        summaryWordCount.textContent = 'Words: 0';
        statusElement.textContent = 'All cleared';
        setTimeout(() => {
            statusElement.textContent = 'Ready';
        }, 2000);
    });
    
    // Copy to clipboard
    copyBtn.addEventListener('click', function() {
        const summaryContent = summaryText.innerText;
        
        if (!summaryContent) {
            statusElement.textContent = 'Nothing to copy';
            return;
        }
        
        navigator.clipboard.writeText(summaryContent)
            .then(() => {
                statusElement.textContent = 'Summary copied to clipboard';
                setTimeout(() => {
                    statusElement.textContent = 'Ready';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                statusElement.textContent = 'Failed to copy to clipboard';
            });
    });
    
    // Save summary
    saveBtn.addEventListener('click', function() {
        const summaryContent = summaryText.innerText;
        
        if (!summaryContent) {
            statusElement.textContent = 'No summary to save';
            return;
        }
        
        const blob = new Blob([summaryContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'summary.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        statusElement.textContent = 'Summary saved';
        setTimeout(() => {
            statusElement.textContent = 'Ready';
        }, 2000);
    });
    
    // Paste from clipboard
    pasteBtn.addEventListener('click', function() {
        navigator.clipboard.readText()
            .then(text => {
                inputText.value = text;
                updateInputWordCount();
                statusElement.textContent = 'Text pasted from clipboard';
                setTimeout(() => {
                    statusElement.textContent = 'Ready';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to read clipboard contents: ', err);
                statusElement.textContent = 'Failed to paste from clipboard';
            });
    });
    
    // Load sample text
    loadSampleBtn.addEventListener('click', function() {
        statusElement.textContent = 'Loading sample text...';
        
        fetch('/static/sample_text.txt')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.text();
            })
            .then(text => {
                inputText.value = text;
                updateInputWordCount();
                statusElement.textContent = 'Sample text loaded';
                setTimeout(() => {
                    statusElement.textContent = 'Ready';
                }, 2000);
            })
            .catch(error => {
                console.error('Error loading sample text:', error);
                statusElement.textContent = 'Error loading sample text';
                
                // Fallback: try to load directly using XMLHttpRequest
                const xhr = new XMLHttpRequest();
                xhr.open('GET', '/static/sample_text.txt', true);
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            inputText.value = xhr.responseText;
                            updateInputWordCount();
                            statusElement.textContent = 'Sample text loaded';
                            setTimeout(() => {
                                statusElement.textContent = 'Ready';
                            }, 2000);
                        }
                    }
                };
                xhr.send();
            });
    });
    
    // Summarize text
    summarizeBtn.addEventListener('click', function() {
        const text = inputText.value.trim();
        
        if (text === '') {
            statusElement.textContent = 'Please enter some text first';
            return;
        }
        
        // Get parameter values
        const summaryRatio = summaryLengthSlider.value / 100;
        const thresholdFactor = importanceThresholdSlider.value / 10;
        
        // Show loading
        loadingOverlay.style.display = 'flex';
        statusElement.textContent = 'Summarizing...';
        
        // Make API request to summarize
        fetch('/api/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                summary_ratio: summaryRatio,
                threshold_factor: thresholdFactor
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update summary display
            summaryText.innerHTML = data.summary.replace(/\n/g, '<br>');
            
            // Update statistics
            const stats = data.stats;
            statsDisplay.innerHTML = `
                <p>Original: ${stats.original_sentences} sentences, ${stats.original_words} words</p>
                <p>Summary: ${stats.summary_sentences} sentences, ${stats.summary_words} words</p>
                <p>Compression: ${stats.compression_ratio}%</p>
            `;
            
            // Update summary word count
            summaryWordCount.textContent = `Words: ${stats.summary_words}`;
            
            // Hide loading and update status
            loadingOverlay.style.display = 'none';
            statusElement.textContent = 'Summary generated';
            setTimeout(() => {
                statusElement.textContent = 'Ready';
            }, 2000);
        })
        .catch(error => {
            console.error('Error:', error);
            loadingOverlay.style.display = 'none';
            statusElement.textContent = 'Error generating summary';
        });
    });
});
