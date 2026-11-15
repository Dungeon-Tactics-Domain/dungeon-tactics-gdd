# Running the labs server locally (LAN, port 5191)

Run everything from the repository root (`D:\Projetos\dungeon-tactics-labs`). Paths are relative to it.

## Build

```powershell
cd web; npm ci; npm run build; cd ..       # web/dist (npm ci only if node_modules is missing)
cargo build --release -p labs-server        # target\release\labs-server.exe
```

## Start (hidden window, reachable from the LAN)

```powershell
$p = Start-Process target\release\labs-server.exe -ArgumentList '--host','0.0.0.0','--port','5191' `
  -WindowStyle Hidden -PassThru -RedirectStandardError labs-server.log -RedirectStandardOutput labs-server.out.log
$p.Id | Set-Content labs-server.pid
```

It reads `config/fabrica.toml` (git-ignored, real session ids) and serves `web/dist`.
PC: http://localhost:5191/ . Phone: http://192.168.3.10:5191/ (needs the Windows Firewall rule for 5191, Private profile).

## Stop

```powershell
Stop-Process -Id (Get-Content labs-server.pid)
```

## Rebuild after changes

Stop the server, rerun the build commands above (the exe is locked while running), start again.
Web-only changes need just `npm run build`: `web/dist` is read from disk on each request, no restart.

## Check

```powershell
Get-NetTCPConnection -LocalPort 5191 -State Listen
curl.exe -s http://localhost:5191/api/fabrica
curl.exe -N --max-time 5 http://localhost:5191/api/fabrica/stream
```
