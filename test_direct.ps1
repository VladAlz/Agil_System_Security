try {
    $body = @{
        correo = "estudiante@uta.edu.ec"
        password = "student123"
    } | ConvertTo-Json

    $loginResp = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method Post -ContentType "application/json" -Body $body
    $token = $loginResp.token
    Write-Host "Login successful. Token acquired."

    $alertBody = @{
        usuarioId = 3
        lat = -1.2665
        lng = -78.6245
    } | ConvertTo-Json

    $headers = @{
        Authorization = "Bearer $token"
    }

    Write-Host "Sending POST directly to Alerts.Service on port 5002..."
    $alertResp = Invoke-WebRequest -Uri "http://localhost:5002/api/alerts" -Method Post -ContentType "application/json" -Headers $headers -Body $alertBody
    Write-Host "Response Code:" $alertResp.StatusCode
    Write-Host "Response Content:" $alertResp.Content
}
catch {
    Write-Error $_
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errBody = $reader.ReadToEnd()
        Write-Host "Error Response Body:" $errBody
    }
}
