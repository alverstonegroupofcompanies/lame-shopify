Add-Type -AssemblyName System.Drawing
$imgPath = "C:\Users\user\.gemini\antigravity\brain\1ab3b492-3801-4b74-820f-6123f98b9fb5\.user_uploaded\media_1795330353005_f6c98ddd.jpg"
$bmp = New-Object System.Drawing.Bitmap($imgPath)

for ($y = 0; $y -lt 70; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.R -lt 245 -or $c.G -lt 245 -or $c.B -lt 245) {
            Write-Host "Non-white pixel at x=$($x), y=$($y): R=$($c.R), G=$($c.G), B=$($c.B)"
            break
        }
    }
}

$bmp.Dispose()
