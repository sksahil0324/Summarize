"""
Flask web application for Text Summarizer
"""

from flask import Flask, request, jsonify, render_template
from spacy_summarizer import SpacySummarizer

app = Flask(__name__)
summarizer = SpacySummarizer()

@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')

@app.route('/api/summarize', methods=['POST'])
def summarize_text():
    """API endpoint to summarize text"""
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400
    
    text = data['text']
    
    # Get optional parameters with defaults
    summary_ratio = float(data.get('summary_ratio', 0.3))
    threshold_factor = float(data.get('threshold_factor', 1.2))
    
    # Set parameters
    summarizer.set_summary_ratio(summary_ratio)
    summarizer.set_threshold_factor(threshold_factor)
    
    # Generate summary
    summary = summarizer.summarize_text(text)
    stats = summarizer.get_statistics()
    
    return jsonify({
        'summary': summary,
        'stats': stats
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
