# PineAI Flask Backend

Python Flask server that wraps Roboflow's pineapple variety detection model.

## Setup

### 1. Install Python (if not already installed)
- Download from https://www.python.org/
- Add Python to PATH during installation

### 2. Install dependencies
```bash
cd server
pip install -r requirements.txt
```

### 3. Run the server
```bash
python app.py
```

Server will start at `http://localhost:5000`

You should see:
```
* Running on http://0.0.0.0:5000
* WARNING in production...
```

## API Endpoints

### Health Check
```bash
GET http://localhost:5000/health
```
Response:
```json
{
  "status": "OK",
  "message": "Pineapple API running"
}
```

### Predict (Form Data - for file uploads)
```bash
POST http://localhost:5000/predict
Content-Type: multipart/form-data

image: <binary image file>
```

Response:
```json
{
  "class": "Queen",
  "confidence": 0.95,
  "all_predictions": {
    "Queen": 0.95,
    "Smooth Cayenne": 0.05
  }
}
```

### Predict Base64 (for mobile app)
```bash
POST http://localhost:5000/predict-base64
Content-Type: application/json

{
  "image": "base64_encoded_string"
}
```

## Demo Flow

1. **Start Flask server** (this README location):
   ```bash
   cd server
   python app.py
   ```

2. **Start Expo app** (from project root):
   ```bash
   npx expo start
   ```

3. **Test on mobile:**
   - Real-time scanning mode
   - Photo capture mode
   - Gallery upload mode

All modes send images to Flask API → Roboflow AI → Returns predictions

## Roboflow Model Details

- **Model ID**: `pineapple-variety-honut/4`
- **API Key**: `nlx0JgXpbV5WDmhjC2gG` (in app.py)
- **Classes**: Queen, Smooth Cayenne
- **Endpoint**: https://serverless.roboflow.com

## Troubleshooting

**"Failed to connect to localhost API"**
- Make sure Flask server is running: `python app.py`
- Check port 5000 is not blocked

**"Connection refused"**
- Flask server might not be running
- Try: `python app.py` from `/server` directory

**Model predictions seem random**
- Roboflow API might be rate limited
- Check API key is valid
- Wait a few seconds between requests

## Database/Persistent Storage

Your pineapple scan history is saved locally on mobile with timestamps and predictions. No data sent to backend except images for inference.

