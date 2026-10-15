# Recopilador del dólar oficial, blue y Ualá
# Corre cada 10 min vía "Programador de tareas" (RecopiladorDolar).
# Guarda los históricos en:
#   data\dolar_historial.json        (dólar oficial — DolarApi.com)
#   data\dolar_blue_historial.json  (dólar blue — DolarApi.com)
#   data\dolar_uala_historial.json  (dólar Ualá, "te venden" = ask — ComparaDolar)
# para que la página los lea, incluso si la pestaña del navegador estuvo cerrada.

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ErrorActionPreference = 'Stop'

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$carpetaDatos = Join-Path $dir 'data'
$maxPuntos = 288   # 48 hs a una muestra cada 10 min
$minIntervaloMs = 10 * 60 * 1000

if (-not (Test-Path $carpetaDatos)) {
    New-Item -ItemType Directory -Force -Path $carpetaDatos | Out-Null
}

function Actualizar-ArchivoDolar {
    param([double]$Compra, [string]$Ruta)
    $historial = @()
    if (Test-Path $Ruta) {
        try {
            $datos = Get-Content $Ruta -Raw | ConvertFrom-Json
            if ($datos) {
                $historial = @($datos | Where-Object { $_ -and $_.t })
            }
        } catch {
            $historial = @()
        }
    }

    $ahora = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

    $ultimo = $null
    if ($historial.Count -gt 0) { $ultimo = $historial[$historial.Count - 1] }

    if (-not $ultimo -or ($ahora - $ultimo.t) -ge $minIntervaloMs) {
        $muestra = [PSCustomObject]@{ t = $ahora; compra = $Compra }
        $historial = @($historial + $muestra)
    }

    if ($historial.Count -gt $maxPuntos) {
        $historial = $historial[($historial.Count - $maxPuntos)..($historial.Count - 1)]
    }

    # Guardar sin BOM (para que JSON.parse del navegador no falle)
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    if ($historial.Count -eq 0) {
        [System.IO.File]::WriteAllText($Ruta, '[]', $utf8)
    } else {
        $json = ConvertTo-Json -InputObject @($historial) -Compress -Depth 3
        [System.IO.File]::WriteAllText($Ruta, $json, $utf8)
    }
}

try {
    $oficial = Invoke-RestMethod -Uri 'https://dolarapi.com/v1/dolares/oficial' -TimeoutSec 20
    Actualizar-ArchivoDolar -Compra ([double]$oficial.compra) -Ruta (Join-Path $carpetaDatos 'dolar_historial.json')

    $blue = Invoke-RestMethod -Uri 'https://dolarapi.com/v1/dolares/blue' -TimeoutSec 20
    Actualizar-ArchivoDolar -Compra ([double]$blue.compra) -Ruta (Join-Path $carpetaDatos 'dolar_blue_historial.json')

    $usd = Invoke-RestMethod -Uri 'https://api.comparadolar.ar/usd' -TimeoutSec 20
    $uala = $usd | Where-Object { $_.slug -eq 'uala' } | Select-Object -First 1
    if ($uala -and $uala.ask) {
        Actualizar-ArchivoDolar -Compra ([double]$uala.ask) -Ruta (Join-Path $carpetaDatos 'dolar_uala_historial.json')
    }
} catch {
    $log = Join-Path $carpetaDatos 'dolar_error.log'
    Add-Content -Path $log -Value ((Get-Date).ToString('yyyy-MM-dd HH:mm:ss') + ' ' + $_.Exception.Message)
}