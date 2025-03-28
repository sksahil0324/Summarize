"""
Main entry point for the text summarization application.
"""
from app import app

def main():
    """Main function to start the web application."""
    # Start the Flask app
    print("Starting Text Summarization web application...")
    app.run(host='0.0.0.0', port=5000, debug=True)

if __name__ == "__main__":
    main()
