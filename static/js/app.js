// DOM Elements
const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const cameraError = document.getElementById('camera-error');
const emotionsDisplay = document.getElementById('emotions-display');
const noFaceMessage = document.getElementById('no-face-message');
const faceCount = document.getElementById('face-count');
const emotionsList = document.getElementById('emotions-list');

// Global variables
let stream = null;
let isProcessing = false;
let processingInterval = null;
const ctx = canvas.getContext('2d');
const overlayCtx = overlay.getContext('2d');

// Event listeners
document.addEventListener('DOMContentLoaded', initApp);
startBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', stopCamera);

/**
 * Initialize the application
 */
function initApp() {
    console.log('Emotion Detection App initialized');
    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showError('Your browser does not support camera access. Please try a different browser.');
        startBtn.disabled = true;
    }
}

/**
 * Start the camera and begin processing
 */
async function startCamera() {
    try {
        // Notify user that camera is starting
        console.log('Requesting camera access...');
        
        // Request camera permissions with better quality for face detection
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                facingMode: 'user',
                frameRate: { min: 15, ideal: 30 }
            },
            audio: false
        });
        
        // Set up video stream
        video.srcObject = stream;
        
        // Wait for video to be ready
        video.onloadedmetadata = () => {
            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            overlay.width = video.videoWidth;
            overlay.height = video.videoHeight;
            
            // Hide start button, show stop button
            startBtn.classList.add('d-none');
            stopBtn.classList.remove('d-none');
            
            // Hide any previous errors
            cameraError.classList.add('d-none');
            
            // Start processing frames
            startProcessing();
        };
    } catch (error) {
        console.error('Error accessing camera:', error);
        showError('Could not access the camera. Please make sure you\'ve granted permission.');
    }
}

/**
 * Start processing video frames
 */
function startProcessing() {
    if (processingInterval) {
        clearInterval(processingInterval);
    }
    
    // Process frames every 200ms (5 fps)
    processingInterval = setInterval(processFrame, 200);
}

/**
 * Process a single video frame
 */
async function processFrame() {
    // Skip if already processing or video isn't ready
    if (isProcessing || !video.videoWidth) return;
    
    isProcessing = true;
    
    try {
        // Ensure canvas dimensions match video for proper scaling
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            overlay.width = video.videoWidth;
            overlay.height = video.videoHeight;
            console.log(`Canvas resized to ${canvas.width}x${canvas.height}`);
        }
        
        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get canvas data as base64 image - use higher quality for better face detection
        const imageData = canvas.toDataURL('image/jpeg', 0.95);
        
        console.log('Sending frame for processing...');
        
        // Send to backend for processing
        const response = await fetch('/detect_emotion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData }),
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
        
        const result = await response.json();
        
        // Display results
        displayResults(result);
        
    } catch (error) {
        console.error('Error processing frame:', error);
    } finally {
        isProcessing = false;
    }
}

/**
 * Display emotion detection results
 */
function displayResults(result) {
    console.log('Displaying results:', result);
    
    // Clear previous overlay
    overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
    
    // Update face count
    faceCount.textContent = result.count;
    
    // Handle no faces detected
    if (result.count === 0) {
        noFaceMessage.classList.remove('d-none');
        emotionsDisplay.classList.add('d-none');
        return;
    }
    
    // Show emotions display, hide no face message
    noFaceMessage.classList.add('d-none');
    emotionsDisplay.classList.remove('d-none');
    
    // Clear previous emotions list
    emotionsList.innerHTML = '';
    
    // Draw boxes around faces and add emotion labels
    result.faces.forEach((face, index) => {
        const { box, emotion, confidence } = face;
        const [x, y, width, height] = box;
        
        console.log(`Drawing face ${index+1} at (${x},${y}) size ${width}x${height}`);
        
        // Draw face box with thicker border for visibility
        overlayCtx.strokeStyle = '#6C63FF';
        overlayCtx.lineWidth = 4;
        overlayCtx.strokeRect(x, y, width, height);
        
        // Make emotion label more visible
        const labelWidth = 120;
        const labelHeight = 30;
        const labelY = Math.max(y - labelHeight, 0); // Ensure label doesn't go off screen
        
        // Draw emotion label with background
        overlayCtx.fillStyle = getEmotionColor(emotion);
        overlayCtx.fillRect(x, labelY, labelWidth, labelHeight);
        
        // Draw text with better contrast
        overlayCtx.fillStyle = '#FFFFFF';
        overlayCtx.font = 'bold 16px Inter, sans-serif';
        overlayCtx.fillText(`${emotion} (${Math.round(confidence * 100)}%)`, x + 5, labelY + 20);
        
        // Add to emotions list with more information
        const emotionItem = document.createElement('div');
        emotionItem.className = 'emotion-item';
        
        // Style based on emotion
        emotionItem.style.borderLeft = `4px solid ${getEmotionColor(emotion)}`;
        emotionItem.style.paddingLeft = '8px';
        
        emotionItem.innerHTML = `
            <span class="emotion-name">Face ${index + 1}: ${emotion}</span>
            <span class="emotion-confidence">${Math.round(confidence * 100)}%</span>
        `;
        emotionsList.appendChild(emotionItem);
    });
}

/**
 * Get color for an emotion
 */
function getEmotionColor(emotion) {
    const colors = {
        'Angry': '#F56565',
        'Disgust': '#805AD5',
        'Fear': '#9F7AEA',
        'Happy': '#48BB78',
        'Sad': '#3182CE',
        'Surprise': '#ECC94B',
        'Neutral': '#2D3748'
    };
    
    return colors[emotion] || '#6C63FF';
}

/**
 * Stop the camera and processing
 */
function stopCamera() {
    // Stop processing interval
    if (processingInterval) {
        clearInterval(processingInterval);
        processingInterval = null;
    }
    
    // Stop all tracks from the stream
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    // Reset video source
    video.srcObject = null;
    
    // Clear canvas and overlay
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
    
    // Reset UI
    startBtn.classList.remove('d-none');
    stopBtn.classList.add('d-none');
    noFaceMessage.classList.remove('d-none');
    emotionsDisplay.classList.add('d-none');
}

/**
 * Show error message
 */
function showError(message) {
    cameraError.textContent = message;
    cameraError.classList.remove('d-none');
}
