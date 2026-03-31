# PineAI App Icons - Setup Guide

## ✅ Status
Your SVG icon templates have been successfully generated! The icons feature:
- **Grass icon design** (matches splash screen and login screen)
- **Orange brand color** (#EA580C)
- **Multiple sizes** for different platforms

### SVG Files Created
Located in `assets/images/`:
- `icon.svg` (1024×1024) - Main app icon
- `android-icon-foreground.svg` (1080×1080) - Android foreground
- `android-icon-background.svg` (1080×1080) - Android background
- `android-icon-monochrome.svg` (1080×1080) - Android monochrome
- `splash-icon.svg` (200×200) - Splash screen
- `favicon.svg` (192×192) - Web favicon

## 🎨 How to Convert SVG → PNG

Choose your preferred method:

### **Option 1: Online Converter (EASIEST - No Installation)**
1. Go to: **https://cloudconvert.com/svg-to-png**
2. Upload each SVG file from `assets/images/`
3. Settings:
   - Scale: Match the size in the filename (e.g., icon.svg → 1024)
   - Output: PNG
4. Download and save as the corresponding `.png` filename in `assets/images/`

**Recommended order:**
1. icon.svg → icon.png (1024×1024)
2. android-icon-foreground.svg → android-icon-foreground.png
3. android-icon-background.svg → android-icon-background.png
4. android-icon-monochrome.svg → android-icon-monochrome.png
5. splash-icon.svg → splash-icon.png (200×200)
6. favicon.svg → favicon.png (192×192)

### **Option 2: Using ImageMagick (Command Line)**
If you have ImageMagick installed:
```bash
# Run the batch script
convert-icons.bat
```

Or manually:
```bash
magick convert assets/images/icon.svg -resize 1024x1024 assets/images/icon.png
magick convert assets/images/android-icon-foreground.svg -resize 1080x1080 assets/images/android-icon-foreground.png
# ... repeat for other files
```

[Download ImageMagick here](https://imagemagick.org/script/download.php)

### **Option 3: Using Inkscape**
1. Open each SVG in [Inkscape](https://inkscape.org/)
2. File → Export As → PNG Image
3. Set the size (width × height) as specified
4. Save to `assets/images/`

### **Option 4: Using Figma, Photoshop, or GIMP**
1. Open the SVG file
2. Export as PNG with specified dimensions
3. Save to `assets/images/`

## ✨ Result
Once converted, your APK will display the same grass icon design across:
- ✅ App icon
- ✅ Login screen  
- ✅ Splash screen
- ✅ Favicon (web)
- ✅ Android adaptive icons

## 📱 Testing
After converting the PNG files:
```bash
npm run android    # Test on Android
npm run ios        # Test on iOS
npm run web        # Test on web
```

The app icon should now show the grass design on app install and launch screens!
