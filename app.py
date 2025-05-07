import os
import logging
import io
import base64
import numpy as np
import cv2
from flask import Flask, render_template, request, jsonify
from emotion_detector import EmotionDetector

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key")

# Initialize emotion detector
emotion_detector = EmotionDetector()

@app.route('/')
def index():
    """Render the main application page."""
    return render_template('index.html')

@app.route('/detect_emotion', methods=['POST'])
def detect_emotion():
    """Process image from webcam and detect emotions."""
    try:
        # Get image data from request
        data = request.json
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
            
        # Decode base64 image
        try:
            encoded_data = data['image'].split(',')[1]
            nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                logger.error("Image decoding resulted in None")
                return jsonify({'error': 'Failed to decode image'}), 400
                
            logger.debug(f"Image decoded successfully: shape={img.shape}")
        except Exception as e:
            logger.error(f"Error decoding image: {str(e)}")
            return jsonify({'error': f'Error decoding image: {str(e)}'}), 400
        
        # Process image to detect emotion
        result = emotion_detector.detect(img)
        
        return jsonify(result)
        
    except Exception as e:
        logger.exception("Error detecting emotion")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
