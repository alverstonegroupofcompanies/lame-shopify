Add-Type -AssemblyName System.Drawing
$imgPath = "C:\Users\user\.gemini\antigravity\brain\1ab3b492-3801-4b74-820f-6123f98b9fb5\.user_uploaded\media_1795330353005_f6c98ddd.jpg"
$bmp = New-Object System.Drawing.Bitmap($imgPath)

Write-Host "Finding non-white bounding box..."
$minX = $bmp.Width
$maxX = 0
$minY = $bmp.Height
$maxY = 0

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.R -lt 250 -or $c.G -lt 250 -or $c.B -lt 250) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Non-white bounding box: X = $minX to $maxX, Y = $minY to $maxY"

# Check if there is anything in X < $minX
Write-Host "Check line at top around Y=35:"
for ($x = 0; $x -lt 50; $x += 5) {
    $c = $bmp.GetPixel($x, 37)
    Write-Host "x=$($x), y=37: R=$($c.R), G=$($c.G), B=$($c.B)"
}

$bmp.Dispose()
