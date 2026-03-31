@echo off
REM PineAI Icon Converter
REM This script converts SVG icons to PNG using ImageMagick
REM Install ImageMagick from: https://imagemagick.org/script/download.php

echo Checking for ImageMagick...
where magick >nul 2>nul

if %ERRORLEVEL% NEQ 0 (
    echo ImageMagick not found!
    echo.
    echo Please install ImageMagick from: https://imagemagick.org/
    echo Then run this script again.
    pause
    exit /b 1
)

echo Converting SVG icons to PNG...
echo.

REM Convert each SVG to PNG
magick convert -background white -density 300 assets\images\icon.svg -resize 1024x1024 assets\images\icon.png
if errorlevel 1 goto error
echo. icon.png OK

magick convert -background white -density 300 assets\images\android-icon-foreground.svg -resize 1080x1080 assets\images\android-icon-foreground.png
if errorlevel 1 goto error
echo. android-icon-foreground.png OK

magick convert -background white -density 300 assets\images\android-icon-background.svg -resize 1080x1080 assets\images\android-icon-background.png
if errorlevel 1 goto error
echo. android-icon-background.png OK

magick convert -background white -density 300 assets\images\android-icon-monochrome.svg -resize 1080x1080 assets\images\android-icon-monochrome.png
if errorlevel 1 goto error
echo. android-icon-monochrome.png OK

magick convert -background white -density 300 assets\images\splash-icon.svg -resize 200x200 assets\images\splash-icon.png
if errorlevel 1 goto error
echo. splash-icon.png OK

magick convert -background white -density 300 assets\images\favicon.svg -resize 192x192 assets\images\favicon.png
if errorlevel 1 goto error
echo. favicon.png OK

echo.
echo Icons converted successfully!
pause
exit /b 0

:error
echo Error during conversion!
pause
exit /b 1
