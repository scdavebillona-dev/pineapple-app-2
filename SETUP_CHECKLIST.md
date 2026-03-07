# 🍍 PineAI System - Setup Checklist

## Pre-Demo Setup (Do this first)

### Backend Setup
- [ ] Python 3.8+ installed (`python --version` to check)
- [ ] Navigate to `server/` folder
- [ ] Run `pip install -r requirements.txt`
- [ ] Verify Flask starts: `python app.py`
  - Should show: `Running on http://0.0.0.0:5000`
- [ ] Keep Flask server running (don't close this terminal)

### Frontend Setup
- [ ] Open new terminal in project root
- [ ] Run `npx expo start`
- [ ] Press `a` to launch Android emulator
- [ ] App loads and shows login screen

### User Setup
- [ ] Create account (username, email, password 6+ chars)
- [ ] Login with credentials
- [ ] Navigate to Camera tab

---

## Demo Testing (Step by Step)

### Test 1: Real-Time Scanning
- [ ] Click "Real-Time" button
- [ ] Click "Start Scanning"
- [ ] See predictions appear (Queen or Smooth Cayenne)
- [ ] Check history shows 1+ scans

### Test 2: Photo Capture  
- [ ] Click "Capture" button
- [ ] Click "Take Photo" button
- [ ] Camera opens
- [ ] Take or select photo from dialog
- [ ] Wait for analysis (~2-5 seconds)
- [ ] See result with confidence score
- [ ] Check it appears in history

### Test 3: Gallery Upload
- [ ] Click "Upload" button
- [ ] Click "Select from Gallery"
- [ ] Pick any image from device
- [ ] Wait for analysis
- [ ] See result displayed
- [ ] Verify timestamp and confidence in history

### Test 4: Persistence
- [ ] Close app completely
- [ ] Reopen app in Expo
- [ ] Login again
- [ ] Go to Camera tab
- [ ] History should still show previous scans

---

## API Communication Verification

### Check Flask is working:
```bash
# In another terminal, run:
curl http://localhost:5000/health

# Should return:
{"status": "OK", "message": "Pineapple API running"}
```

### Monitor requests:
- [ ] Flask terminal shows `POST /predict-base64 200`
- [ ] Expo terminal shows `✅ Result: Queen` (or variety)
- [ ] No 500 errors in Flask terminal

---

## Common Issues & Quick Fixes

| Issue | Check | Fix |
|-------|-------|-----|
| "Failed to connect API" | Flask terminal | Run `python app.py` in `/server` |
| "Module not found" (Python) | Flask error message | Run `pip install -r requirements.txt` |
| App won't start | Expo terminal | Run `npx expo start -c` (clear cache) |
| Same prediction always | Flask response | Normal - test with different images |
| Connection refused | Check port 5000 | See DEPLOYMENT_GUIDE.md troubleshooting |

---

## What Each Component Does

### 📱 App (JavaScript/React Native)
- **camera.tsx**: Takes photos, displays predictions
- **auth-context.tsx**: Handles login/signup/storage
- **ml-inference.ts**: Sends images to Flask, gets results

### 🐍 Flask Server (Python)  
- **app.py**: Receives image → calls Roboflow → returns prediction
- Runs on `localhost:5000`
- Handles 3 endpoints: `/health`, `/predict`, `/predict-base64`

### 🤖 Roboflow AI (Cloud)
- Performs actual variety detection
- Returns: variety name + confidence score
- Handles heavy ML computation

### 💾 Local Storage
- AsyncStorage stores user accounts
- Scan history saved on device
- Survives app restart

---

## Demo Script (for Teacher)

**Timing: ~3 minutes**

> "Welcome to PineAI System - an AI app for pineapple variety detection. I'm using Roboflow's trained model to detect Queen and Smooth Cayenne varieties.
>
> **[Open app, login]**
> First, I authenticate. The app stores user data locally on device.
>
> **[Go to Camera]**
> Here's the camera section with three modes:
> 1. **Real-Time** - demonstrates continuous scanning
> 2. **Capture** - uses device camera to take photos
> 3. **Upload** - select from gallery
>
> **[Do quick scan]**
> Watch as the image is sent to our Flask backend, which connects to Roboflow's model. In under 2 seconds, we get the variety with confidence score.
>
> **[Show history]**
> All scans are stored in history with timestamps, keeping a complete record for farmers or inspectors.
>
> The system is built with React Native on Expo Go - no app store installation needed - and can scale to cloud deployment for commercial use."

---

## Success Criteria

✅ **You're ready to demo when:**
- [ ] Flask server running without errors
- [ ] App opens to login
- [ ] Can create account and login
- [ ] Camera tab loads with 3 buttons
- [ ] One camera mode works (any of the 3)
- [ ] See prediction appear in <5 seconds
- [ ] Scan history shows the result
- [ ] Flask terminal shows `POST /predict-base64 200` 

✅ **Extra verification:**
- [ ] Close app, reopen - data persists
- [ ] Different images give different predictions
- [ ] Confidence scores are reasonable (>50%)

---

## Performance Expectations

| Metric | Expected | Notes |
|--------|----------|-------|
| App startup | <3s | After login |
| Image analysis | 1-5s | Includes network + Roboflow |
| Prediction accuracy | 80-95% | Depends on image quality |
| History size | 20 scans | Persists on device |
| Concurrent users | 1 (local) | Scalable to 25+ with cloud |

---

## Files You Modified/Created

**Created:**
- ✨ `server/app.py` - Flask backend
- ✨ `server/requirements.txt` - Python dependencies
- ✨ `DEPLOYMENT_GUIDE.md` - Complete setup guide
- ✨ `QUICK_START.md` - Quick reference
- ✨ `SETUP_CHECKLIST.md` - This file

**Modified:**
- 🔄 `services/ml-inference.ts` - Now calls Flask API
- 🔄 `app/(app)/camera.tsx` - Works with new API

**Unchanged (still work):**
- ✅ `context/auth-context.tsx` - Authentication
- ✅ `app/(auth)/*.tsx` - Login/signup screens
- ✅ `app/(app)/_layout.tsx` - Navigation

---

## Next Steps After Demo

1. **Get feedback** from teacher/stakeholders
2. **Deploy Flask** to cloud if scaling needed
3. **Test on multiple devices** to verify API calls
4. **Add more features** (export history, analytics, etc.)
5. **Improve UI** based on feedback

---

## Important Notes

⚠️ **Keep This Terminal Running:**
```bash
cd server
python app.py
```
Do NOT close this while testing the app.

⚠️ **API Key Visible:**
The Roboflow API key is in `server/app.py`. For production, move to environment variables.

⚠️ **Local Demo Only:**
Both Flask and app must be on same machine/network for localhost:5000 to work.

---

## Questions to Ask Yourself

Before demo:
- [ ] Does Flask start without errors?
- [ ] Can I login to app?
- [ ] Do camera buttons appear?
- [ ] Does one mode work and return a result?
- [ ] Does history get populated?
- [ ] Does closing/reopening app keep data?

If any "no" → check terminal logs for errors → refer to DEPLOYMENT_GUIDE.md

---

**Version:** 1.0
**Last Updated:** February 21, 2026  
**Status:** 🟢 Ready for Demo
