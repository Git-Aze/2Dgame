param([ValidateRange(1, 65535)][int]$Port = 8000)

# Local-only development server, with no installation or build step.
$projectRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$rootPrefix = $projectRoot + [IO.Path]::DirectorySeparatorChar
$mimeTypes = @{ '.html' = 'text/html'; '.js' = 'text/javascript'; '.css' = 'text/css'; '.png' = 'image/png'; '.json' = 'application/json'; '.md' = 'text/plain' }
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
try {
  $listener.Start()
} catch {
  $listener.Stop()
  throw "Cannot start the local server on port $Port. Another server may already be running. Open http://localhost:$Port or try: powershell -NoProfile -ExecutionPolicy Bypass -File .\serve.ps1 -Port 8080. Details: $($_.Exception.GetBaseException().Message)"
}
Write-Host "TopDownSoloRPG: http://localhost:$Port (Ctrl+C to stop)"
try {
  while ($true) {
    if (-not $listener.Pending()) {
      Start-Sleep -Milliseconds 50
      continue
    }
    $client = $listener.AcceptTcpClient()
    $client.ReceiveTimeout = 5000
    $stream = $client.GetStream()
    try {
      $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
      $request = $reader.ReadLine()
      if (-not $request) { continue }
      while ($reader.ReadLine()) {}
      $method, $requestPath = $request.Split(' ')[0..1]
      $relative = [Uri]::UnescapeDataString($requestPath.Split('?')[0]).TrimStart('/')
      if (-not $relative) { $relative = 'index.html' }
      $target = [IO.Path]::GetFullPath((Join-Path $projectRoot $relative))
      $status = '200 OK'
      $contentType = 'text/plain'
      if ($method -notin @('GET', 'HEAD')) {
        $status = '405 Method Not Allowed'
      } elseif (-not $target.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase) -or
          ($relative -split '[/\\]' | Where-Object { $_.StartsWith('.') })) {
        $status = '403 Forbidden'
      } elseif (-not [IO.File]::Exists($target)) {
        $status = '404 Not Found'
      }
      if ($status -eq '200 OK') {
        $body = [IO.File]::ReadAllBytes($target)
        $extension = [IO.Path]::GetExtension($target).ToLowerInvariant()
        $contentType = $mimeTypes[$extension]
        if (-not $contentType) { $contentType = 'application/octet-stream' }
      } else {
        $body = [Text.Encoding]::UTF8.GetBytes($status)
      }
      $header = [Text.Encoding]::ASCII.GetBytes("HTTP/1.1 $status`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n")
      $stream.Write($header, 0, $header.Length)
      if ($method -ne 'HEAD') { $stream.Write($body, 0, $body.Length) }
      $stream.Flush()
    } catch {
      Write-Verbose $_.Exception.Message
    } finally {
      $stream.Dispose()
      $client.Dispose()
    }
  }
} finally {
  $listener.Stop()
}
