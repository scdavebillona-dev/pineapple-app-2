# 🍍 PineAI System - Quick Start Guide

## Demo Checklist

- [ ] Python installed on your computer
- [ ] Flask server running on `localhost:5000`
- [ ] Expo app running on Android (emulator or device)
- [ ] Both on same network (or localhost for same machine)

## Step 1: Start Flask Backend

```bash
cd server
pip install -r requirements.txt
python app.py
```

You should see:
```
* Running on http://0.0.0.0:5000
 WARNING in production mode!
```

## Step 2: Start Expo App

Open a new terminal:

```bash
npx expo start
```

Then:
- Press `a` for Android emulator
- OR scan QR code with Expo Go app on physical Android device

## Step 3: Test the App

**Demo Flow:**

1. Create account / Login
2. Go to **Camera** tab
3. Choose mode:
   - **Real-Time**: Continuous scanning
   - **Capture**: Take photo with camera
   - **Upload**: Select from gallery

4. Camera sends image → Flask API → Roboflow AI → Prediction
5. See result with confidence score
6. All results saved in history

## Expected Output Format

When you analyze an image:
```
Detected: Queen
Confidence: 87.5%
```

Or:
```
Detected: Smooth Cayenne
Confidence: 92.1%
```

## API Architecture

```
React Native App (camera.tsx)
        ↓
   Image (base64)
        ↓
Flask API (localhost:5000)
        ↓
Roboflow Model (Cloud)
        ↓
Predictions (Queen/Smooth Cayenne)
        ↓
Display in App
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Failed to connect to 127.0.0.1:5000" | Start Flask: `python app.py` in `/server` folder |
| ConnectionError in logs | Make sure Flask is running BEFORE starting Expo |
| 500 error from Flask | Check Roboflow API key in `server/app.py` is valid |
| Import errors (Python) | Run: `pip install -r requirements.txt` |
| "Module not found" (npm) | Run: `npm install` from project root |

## Files Overview

```
pineapple-app-2/
├── app/                          # React Native app screens
│   └── (app)/camera.tsx         # Camera & inference UI
├── services/
│   └── ml-inference.ts          # Inference service (calls Flask API)
├── server/
│   ├── app.py                   # Flask API server
│   ├── requirements.txt          # Python dependencies
│   └── README.md                # Backend documentation
└── context/auth-context.tsx     # Authentication logic
```

## Key Endpoints

**Health Check** (to verify server is running)
```bash
curl http://localhost:5000/health
```

**Predict** (image analysis)
```bash
curl -X POST http://localhost:5000/predict-base64 \
  -H "Content-Type: application/json" \
  -d '{"image": "base64data..."}'
```

## Demo Notes for Teacher

✅ **What works:**
- Live image analysis with real AI predictions
- Three camera modes (real-time, capture, upload)
- Persistent history of all scans
- Fast inference (<2 seconds per image)
- Variety detection (Queen vs Smooth Cayenne)

🌐 **Backend:**
- Python Flask server (runs locally or cloud)
- Roboflow API for model serving
- Real TensorFlow models (not mock)

📱 **Mobile:**
- Works on Expo Go (no build needed)
- Real-time camera access
- Gallery photo selection
- Automatic history logging

## Questions?

Check the server logs for errors:
```bash
# Terminal 1 (Flask logs)
python app.py

# Terminal 2 (Expo logs)
npx expo start
```

Both should show request/response logs.
