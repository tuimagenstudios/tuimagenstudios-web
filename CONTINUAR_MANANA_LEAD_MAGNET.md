# Continuidad - Lead Magnet Auditoria

Fecha de cierre: 2026-05-17 22:50 +10

## Repo correcto de produccion

El servicio de Railway `lead-magnet-auditoria` NO despliega desde este repo web.
Despliega desde:

- GitHub: `tuimagenstudios/lead-magnet-auditoria`
- Railway project: `pacific-benevolence`
- Railway service: `lead-magnet-auditoria`
- Service ID: `0ae9e217-4eca-4fa7-a58e-485da1d09fdf`
- Environment: `production`
- Environment ID: `f8fc03f0-3128-4652-931d-197de07fccb8`
- URL publica: `https://lead-magnet-auditoria-production.up.railway.app`

## Bloque 6.1 - WeasyPrint / Railpack

Problema inicial:

- Railway estaba en `CRASHED`.
- Logs mostraban fallo de WeasyPrint por librerias runtime faltantes:
  `cannot load library 'libgobject-2.0-0'`.

Fix aplicado en `tuimagenstudios/lead-magnet-auditoria`:

- Se elimino `nixpacks.toml`.
- Se creo `railpack.json`.
- Se agregaron paquetes apt para build y runtime.
- Importante: en Railpack oficial, runtime va en:

```json
"deploy": {
  "aptPackages": []
}
```

Commit:

- `26f0dc3 fix: bloque 6.1 - migrar a Railpack para WeasyPrint`

Resultado:

- Railway paso a `SUCCESS`.
- WeasyPrint dejo de crashear.

## Bloque 6.2 - load_dotenv / Railway env

Problema observado:

- Railway tenia `DEEPSEEK_API_KEY_1` cargada, pero logs decian:
  `Keys DeepSeek cargadas: 0`
  y `Todas las API keys de DeepSeek fallaron`.

Diagnostico:

- `generador.py` llamaba `load_dotenv()` a nivel modulo.
- `DEEPSEEK_MODEL` y `DEEPSEEK_BASE_URL` se leen al importar.
- Las keys reales se leen en runtime dentro de `_keys_disponibles()`.
- `load_dotenv()` por defecto ya usa `override=False`, asi que no era la causa raiz directa.
- `railway run` confirmo que el entorno de Railway si ve las keys.
- El problema se resolvio al redeployar con las variables ya sincronizadas.

Fix aplicado para dejar la intencion explicita:

```py
# generador.py
load_dotenv(override=False)

# email_sender.py
load_dotenv(override=False)
```

Commit:

- `e1f4be6 fix: bloque 6.2 - load_dotenv override=False para no pisar Railway`

Validacion:

- Tests locales en venv del clon:
  `python -m unittest discover -s tests`
- Resultado:
  `37 tests OK`

POST publico exitoso despues del deploy:

```json
{
  "status": "recibido",
  "email": "tuimagenstudio@gmail.com",
  "diagnostico_generado": true,
  "pdf_generado": true,
  "pdf_path": "/tmp/auditoria_tuimagenstudio_gmail.com_20260517_122822.pdf",
  "email_enviado": true,
  "email_id": "fb06d054-456e-4c32-974b-57d1d23836e3"
}
```

## Fallback de DeepSeek con 3 keys

Se sincronizaron las keys de fallback en Railway desde el `.env` local.
No guardar ni imprimir claves completas.

Estado verificado sin exponer secretos:

```text
DEEPSEEK_API_KEY_1: cargada, length 35, suffix b7c7
DEEPSEEK_API_KEY_2: cargada, length 36, suffix 25fS
DEEPSEEK_API_KEY_3: cargada, length 35, suffix 490c
```

El codigo ya rota automaticamente:

- Lee `DEEPSEEK_API_KEY_1`.
- Si falla, prueba `DEEPSEEK_API_KEY_2`.
- Si falla, prueba `DEEPSEEK_API_KEY_3`.
- Tambien contempla `DEEPSEEK_API_KEY_4`, pero actualmente esta vacia.

Redeploy forzado despues de sincronizar keys:

- Deployment ID: `77641865-6ff7-494d-9001-36436c88efa2`
- Estado final: `SUCCESS`
- Replicas: 1 running, 0 crashed.

Verificacion dentro del entorno Railway:

```text
[(1, True, 35, 'b7c7'), (2, True, 36, '25fS'), (3, True, 35, '490c')]
```

## Comandos utiles para retomar

Clonar repo correcto si hace falta:

```powershell
git clone https://github.com/tuimagenstudios/lead-magnet-auditoria.git _codex_lead-magnet-auditoria
```

Ver estado del servicio:

```powershell
railway service list --json --project 622702a2-b1e9-4e0c-86b3-91fc1b019f77 --environment f8fc03f0-3128-4652-931d-197de07fccb8
```

Ver variables sin exponer secretos completos:

```powershell
$vars = railway variable list --json --project 622702a2-b1e9-4e0c-86b3-91fc1b019f77 --environment f8fc03f0-3128-4652-931d-197de07fccb8 --service 0ae9e217-4eca-4fa7-a58e-485da1d09fdf | ConvertFrom-Json
$vars.PSObject.Properties | Where-Object { $_.Name -like 'DEEPSEEK_API_KEY_*' } | Sort-Object Name | ForEach-Object {
  $v=[string]$_.Value
  [pscustomobject]@{Name=$_.Name; Set=($v.Length -gt 0); Length=$v.Length; Suffix= if ($v.Length -ge 4) { $v.Substring($v.Length-4) } else { '' }}
} | Format-Table -AutoSize
```

POST publico de prueba:

```powershell
$body = @{
  url='https://tuimagenstudios.com'
  instagram='@tuimagen_studio'
  email='tuimagenstudio@gmail.com'
  frecuencia='esporadica'
  estrategia='improvisado'
  reto='ideas'
} | ConvertTo-Json -Compress

Invoke-RestMethod -Method Post -Uri 'https://lead-magnet-auditoria-production.up.railway.app/auditar' -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 10
```

## Pendientes / siguiente foco

- Revisar si conviene borrar `DEEPSEEK_API_KEY_4` vacia o dejarla reservada.
- Hacer un test real de recepcion del email en Gmail y revisar asunto, PDF adjunto y branding.
- Decidir si el resumen de continuidad debe moverse tambien al repo `lead-magnet-auditoria` como `ESTADO.md`.
- No tocar cambios actuales del repo web sin revisar: `logo.png`, `og-image.png`, `despertar/_borradores-codex-no-publicar/`, `lead-magnet/`.

