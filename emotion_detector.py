import cv2
import numpy as np
import logging
import os

class EmotionDetector:
    """Class to handle emotion detection using OpenCV and pre-trained models."""
    
    def __init__(self):
        """Initialize the emotion detector with pre-trained models."""
        self.logger = logging.getLogger(__name__)
        
        # Define emotions
        self.emotions = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']
        
        # Load face detection model (Haar Cascade)
        self.face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        if not os.path.exists(self.face_cascade_path):
            self.logger.error(f"Face cascade file not found at {self.face_cascade_path}")
            raise FileNotFoundError(f"Face cascade file not found at {self.face_cascade_path}")
            
        self.face_cascade = cv2.CascadeClassifier(self.face_cascade_path)
        
        # For a real application, we would load a pre-trained emotion detection model here
        # For this example, we'll use a simplified approach with Haar Cascade for face detection
        # and a simulated emotion detection to avoid external dependencies
        self.logger.info("Emotion detector initialized successfully")
    
    def detect(self, image):
        """
        Detect faces and emotions in the image.
        
        Args:
            image: OpenCV image in BGR format
            
        Returns:
            Dictionary containing detection results
        """
        # Convert image to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Log image properties for debugging
        self.logger.debug(f"Processing image for face detection: shape={gray.shape}, dtype={gray.dtype}")
        
        # Detect faces with more sensitive parameters
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.05,  # More granular scaling for better detection
            minNeighbors=3,    # Reduced from 5 to detect more faces
            minSize=(20, 20),  # Smaller minimum size to detect faces further from camera
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        self.logger.debug(f"Face detection results: found {len(faces)} faces")
        
        results = {
            'faces': [],
            'count': len(faces)
        }
        
        # Process each detected face
        for (x, y, w, h) in faces:
            face_roi = gray[y:y + h, x:x + w]
            
            # In a real application, you would feed this face to an emotion classification model
            # For this example, we'll use a simulated result
            # In a production application, you'd use a proper model like FER2013 or a deep learning model
            
            # Simulate emotion detection (random for demonstration)
            # In a real app, this would be the output of your emotion classification model
            emotion_idx = np.random.randint(0, len(self.emotions))
            emotion = self.emotions[emotion_idx]
            confidence = np.random.uniform(0.7, 1.0)
            
            # Add face results
            results['faces'].append({
                'box': [int(x), int(y), int(w), int(h)],
                'emotion': emotion,
                'confidence': float(confidence)
            })
        
        return results
