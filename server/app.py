from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import base64
import os
from PIL import Image
from io import BytesIO
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Roboflow API Configuration
ROBOFLOW_API_URL = "https://detect.roboflow.com"
ROBOFLOW_API_KEY = "nlx0JgXpbV5WDmhjC2gG"
MODEL_ID = "pineapple-variety-honut/4"

# Class mapping
CLASS_NAMES = ["Queen", "Smooth Cayenne"]

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "OK", "message": "Pineapple API running"}), 200

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict pineapple variety from image
    Expects: multipart/form-data with 'image' file
    Returns: {
        "class": "Queen" or "Smooth Cayenne",
        "confidence": 0.0-1.0,
        "all_predictions": {class_name: confidence, ...}
    }
    """
    try:
        # Get image from request
        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        logger.info(f"Processing image: {file.filename}")
        
        # Read image bytes
        image_data = file.read()
        
        # Prepare request to Roboflow
        url = f"{ROBOFLOW_API_URL}/{MODEL_ID}?api_key={ROBOFLOW_API_KEY}"
        
        files = {
            'imageToUpload': (file.filename, image_data, file.content_type)
        }
        
        # Call Roboflow API
        logger.info("Sending to Roboflow API...")
        response = requests.post(url, files=files)
        
        if response.status_code != 200:
            logger.error(f"Roboflow API error: {response.status_code}")
            return jsonify({"error": f"Roboflow API error: {response.status_code}"}), 500
        
        result = response.json()
        logger.info(f"Roboflow response: {result}")
        
        # Extract predictions
        predictions = result.get("predictions", {})
        
        # Calculate confidence for each class
        all_confidences = {}
        highest_confidence = 0
        top_class = "Unknown"
        
        for pred in predictions:
            class_name = pred.get("class", "Unknown")
            confidence = pred.get("confidence", 0)
            
            if class_name not in all_confidences:
                all_confidences[class_name] = confidence
            else:
                all_confidences[class_name] = max(all_confidences[class_name], confidence)
            
            if confidence > highest_confidence:
                highest_confidence = confidence
                top_class = class_name
        
        # Ensure both classes are represented
        for class_name in CLASS_NAMES:
            if class_name not in all_confidences:
                all_confidences[class_name] = 0.0
        
        response_data = {
            "class": top_class,
            "confidence": min(highest_confidence, 1.0),
            "all_predictions": all_confidences
        }
        
        logger.info(f"Prediction: {response_data}")
        return jsonify(response_data), 200
    
    except Exception as e:
        logger.error(f"Error during inference: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/predict-base64', methods=['POST'])
def predict_base64():
    """
    Alternative endpoint for base64 encoded images
    Expects: {"image": "base64_encoded_string"}
    """
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({"error": "No image data provided"}), 400
        
        # Decode base64
        image_data = base64.b64decode(data['image'])
        
        logger.info("Processing base64 image")
        
        # Prepare request to Roboflow
        url = f"{ROBOFLOW_API_URL}/{MODEL_ID}?api_key={ROBOFLOW_API_KEY}"
        
        files = {
            'imageToUpload': ('image.jpg', image_data, 'image/jpeg')
        }
        
        # Call Roboflow API
        logger.info("Sending to Roboflow API...")
        response = requests.post(url, files=files)
        
        if response.status_code != 200:
            logger.error(f"Roboflow API error: {response.status_code}")
            return jsonify({"error": f"Roboflow API error: {response.status_code}"}), 500
        
        result = response.json()
        logger.info(f"Roboflow response: {result}")
        
        # Extract predictions
        predictions = result.get("predictions", {})
        
        # Calculate confidence for each class
        all_confidences = {}
        highest_confidence = 0
        top_class = "Unknown"
        
        for pred in predictions:
            class_name = pred.get("class", "Unknown")
            confidence = pred.get("confidence", 0)
            
            if class_name not in all_confidences:
                all_confidences[class_name] = confidence
            else:
                all_confidences[class_name] = max(all_confidences[class_name], confidence)
            
            if confidence > highest_confidence:
                highest_confidence = confidence
                top_class = class_name
        
        # Ensure both classes are represented
        for class_name in CLASS_NAMES:
            if class_name not in all_confidences:
                all_confidences[class_name] = 0.0
        
        response_data = {
            "class": top_class,
            "confidence": min(highest_confidence, 1.0),
            "all_predictions": all_confidences
        }
        
        logger.info(f"Prediction: {response_data}")
        return jsonify(response_data), 200
    
    except Exception as e:
        logger.error(f"Error during inference: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run on localhost:5000 for local demo
    app.run(debug=True, host='0.0.0.0', port=5000)
