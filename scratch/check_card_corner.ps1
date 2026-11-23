Add-Type -AssemblyName System.Drawing
$imgPath = "C:\Users\user\.gemini\antigravity\brain\1ab3b492-3801-4b74-820f-6123f98b9fb5\.user_uploaded\media_1795330353005_f6c98ddd.jpg"
$bmp = New-Object System.Drawing.Bitmap($imgPath)

Write-Host "Checking pixels around x=155 at y from 65 to 100:"
for ($y = 65; $y -le 90; $y++) {
    $firstNonWhite = -1
    for ($x = 140; $x -le 170; $x++) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.R -lt 250 -or $c.G -lt 250 -or $c.B -lt 250) {
            $firstNonWhite = $x
            break
        }
    }
    Write-Host "y=$($y): first non-white at x=$($firstNonWhite)"
}

$bmp.Dispose()
