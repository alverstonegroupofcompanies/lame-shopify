Add-Type -AssemblyName System.Drawing
$imgPath = "C:\Users\user\.gemini\antigravity\brain\1ab3b492-3801-4b74-820f-6123f98b9fb5\.user_uploaded\media_1795330353005_f6c98ddd.jpg"
$bmp = New-Object System.Drawing.Bitmap($imgPath)

Write-Host "Scanning column X from 0 to 200 at various Y values:"
for ($x = 0; $x -lt 165; $x += 10) {
    $hasContent = $false
    for ($y = 75; $y -lt 400; $y += 10) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.R -lt 250 -or $c.G -lt 250 -or $c.B -lt 250) {
            $hasContent = $true
            break
        }
    }
    Write-Host "x=$($x): hasContent=$($hasContent)"
}

$bmp.Dispose()
