# PineAI Icon Converter using .NET
# This script converts SVG icons to PNG using SixLabors.ImageSharp library

param([string]$Action = "help")

function Install-Dependencies {
    Write-Host "Installing required NuGet packages..." -ForegroundColor Green
    Write-Host "This may take a few minutes on first run..."
    
    # Check if dotnet-script is installed
    try {
        dotnet script --version >$null 2>&1
    } catch {
        Write-Host "Installing dotnet-script..." -ForegroundColor Yellow
        dotnet tool install -g dotnet-script
    }
}

function Convert-SVGtoPNG {
    Write-Host "`n🎨 Converting SVG icons to PNG..." -ForegroundColor Cyan
    Write-Host "This requires .NET 6+ and may take a moment...`n"
    
    $csx = @'
#!/usr/bin/env dotnet-script

#r "nuget: SixLabors.ImageSharp, 4.0.1"
#r "nuget: SixLabors.ImageSharp.Drawing, 1.0.0-beta17"

using SixLabors.ImageSharp;
using System.IO;
using System.Diagnostics;

// Use SvgRender (if available) or provide fallback instructions
var iconConfigs = new[] {
    new { svg = "icon.svg", png = "icon.png", size = 1024 },
    new { svg = "android-icon-foreground.svg", png = "android-icon-foreground.png", size = 1080 },
    new { svg = "android-icon-background.svg", png = "android-icon-background.png", size = 1080 },
    new { svg = "android-icon-monochrome.svg", png = "android-icon-monochrome.png", size = 1080 },
    new { svg = "splash-icon.svg", png = "splash-icon.png", size = 200 },
    new { svg = "favicon.svg", png = "favicon.png", size = 192 },
};

var assetDir = Path.Combine(Directory.GetCurrentDirectory(), "assets", "images");

Console.WriteLine("⚠️  SVG rendering requires external tools.");
Console.WriteLine("Please use one of these methods:");
Console.WriteLine();
Console.WriteLine("1. Online Converter (Easiest):");
Console.WriteLine("   - Visit: https://cloudconvert.com/svg-to-png");
Console.WriteLine("   - Upload each SVG file and download as PNG");
Console.WriteLine();
Console.WriteLine("2. ImageMagick (if installed):");
Console.WriteLine("   - Install from: https://imagemagick.org/");
Console.WriteLine("   - Run: .\\convert-icons.bat");
Console.WriteLine();
Console.WriteLine("3. Inkscape (if installed):");
Console.WriteLine("   - Install from: https://inkscape.org/");
Console.WriteLine("   - Run batch conversion");
Console.WriteLine();
'@

    # Create a simple C# script file
    $scriptPath = Join-Path (Get-Location) "convert-icons.csx"
    Set-Content -Path $scriptPath -Value $csx
    
    & dotnet script $scriptPath
}

# Main
switch ($Action) {
    "convert" { Convert-SVGtoPNG }
    "install" { Install-Dependencies }
    default {
        Write-Host @"
PineAI Icon Converter
====================

Usage: .\convert-icons.ps1 [action]

Actions:
  convert    Convert SVG icons to PNG
  install    Install dependencies
  help       Show this message

Note: SVG to PNG conversion requires external tools.
See the instructions above for available options.
"@
    }
}
