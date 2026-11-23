Add-Type -AssemblyName System.Drawing
$imgPath = "C:\Users\user\.gemini\antigravity\brain\1ab3b492-3801-4b74-820f-6123f98b9fb5\.user_uploaded\media_1795330353005_f6c98ddd.jpg"
$bmp = New-Object System.Drawing.Bitmap($imgPath)

Write-Host "Width: $($bmp.Width), Height: $($bmp.Height)"

Write-Host "--- Scanning rows at X=200 ---"
for ($y = 0; $y -lt 120; $y += 5) {
    $col = $bmp.GetPixel(200, $y)
    Write-Host "y=$($y) : R=$($col.R), G=$($col.G), B=$($col.B)"
}

Write-Host "--- Scanning columns at y=200 ---"
for ($x = 0; $x -lt $bmp.Width; $x += 15) {
    $col = $bmp.GetPixel($x, 200)
    Write-Host "x=$($x) : R=$($col.R), G=$($col.G), B=$($col.B)"
}

$bmp.Dispose()
