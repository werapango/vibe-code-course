# check-lab.ps1 — ตรวจความพร้อมเครื่องห้อง Lab (หลักสูตร Vibe Coding x SDLC)
# วิธีรัน (ไม่ต้องใช้สิทธิ์ admin):
#   powershell -NoProfile -ExecutionPolicy Bypass -File check-lab.ps1
# ผลลัพธ์: แสดง PASS/FAIL ทีละข้อ และบันทึกไฟล์ check-lab-<ชื่อเครื่อง>.txt ไว้ในโฟลเดอร์เดียวกัน

$ErrorActionPreference = "SilentlyContinue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$results = @()

function Add-Result($name, $ok, $detail) {
    $script:results += [pscustomobject]@{ Check = $name; Result = $(if ($ok) { "PASS" } else { "FAIL" }); Detail = $detail }
}

function Get-Ver($cmd, $arg) {
    $c = Get-Command $cmd -ErrorAction SilentlyContinue
    if (-not $c) { return $null }
    try { return (& $c.Source $arg 2>$null | Select-Object -First 1) } catch { return $null }
}

# 1) ซอฟต์แวร์
$node = Get-Ver "node" "-v"
$nodeOk = $false
if ($node -match "^v(\d+)\.") { $nodeOk = [int]$Matches[1] -ge 22 }
Add-Result "Node.js >= 22" $nodeOk $(if ($node) { $node } else { "not found" })

$npm = Get-Ver "npm.cmd" "-v"
Add-Result "npm" ([bool]$npm) $(if ($npm) { $npm } else { "not found" })

$git = Get-Ver "git" "--version"
Add-Result "Git" ([bool]$git) $(if ($git) { $git } else { "not found" })

$bash = @("$env:ProgramFiles\Git\git-bash.exe", "${env:ProgramFiles(x86)}\Git\git-bash.exe", "$env:LOCALAPPDATA\Programs\Git\git-bash.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
Add-Result "Git Bash" ([bool]$bash) $(if ($bash) { $bash } else { "not found" })

$code = Get-Ver "code.cmd" "--version"
Add-Result "VS Code (code in PATH)" ([bool]$code) $(if ($code) { $code } else { "not found" })

$zcode = @("$env:LOCALAPPDATA\Programs\ZCode", "$env:LOCALAPPDATA\Programs\zcode", "$env:ProgramFiles\ZCode", "$env:ProgramFiles\Z Code") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $zcode) {
    $lnk = Get-ChildItem "$env:ProgramData\Microsoft\Windows\Start Menu\Programs", "$env:APPDATA\Microsoft\Windows\Start Menu\Programs" -Recurse -Filter "*Code*.lnk" -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match "^Z ?Code" } | Select-Object -First 1
    if ($lnk) { $zcode = $lnk.FullName }
}
Add-Result "ZCode" ([bool]$zcode) $(if ($zcode) { $zcode } else { "not found (check Start menu manually)" })

# 2) เครือข่าย (HTTPS ออกภายนอก)
$urls = @(
    "https://registry.npmjs.org/",
    "https://github.com/werapango/workers-app-starter",
    "https://codeload.github.com/",
    "https://dash.cloudflare.com/",
    "https://api.cloudflare.com/client/v4/",
    "https://workers.dev/",
    "https://z.ai/",
    "https://zcode.z.ai/",
    "https://gemini.google.com/",
    "https://chatgpt.com/"
)
foreach ($u in $urls) {
    try {
        $r = Invoke-WebRequest -Uri $u -Method Head -UseBasicParsing -TimeoutSec 15 -MaximumRedirection 5
        Add-Result "HTTPS $u" $true "HTTP $($r.StatusCode)"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        # ได้คำตอบจากเซิร์ฟเวอร์ (แม้เป็น 401/403/404/405) = เครือข่ายถึง
        if ($code) { Add-Result "HTTPS $u" $true "HTTP $code (reachable)" }
        else { Add-Result "HTTPS $u" $false $_.Exception.Message }
    }
}

# 3) พอร์ต localhost ที่ต้องว่าง (wrangler login callback / wrangler dev)
foreach ($p in 8976, 8787) {
    $busy = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    Add-Result "localhost:$p free" (-not $busy) $(if ($busy) { "in use by PID $($busy[0].OwningProcess)" } else { "free" })
}

# 4) npm ใช้งานได้ (ดึงข้อมูลแพ็กเกจจริง)
if ($npm) {
    $w = & npm.cmd view wrangler version 2>$null
    Add-Result "npm view wrangler" ([bool]$w) $(if ($w) { "wrangler $w" } else { "failed (proxy/registry blocked?)" })
}

# 5) ไม่มีบัญชีค้างบนเครื่อง
$wcfg = "$env:APPDATA\xdg.config\.wrangler\config\default.toml"
# (ไฟล์ default.toml อาจยังอยู่หลัง logout — ดูแค่ว่ามี oauth_token ค้างไหม โดยไม่แสดงค่า)
$loggedIn = (Test-Path $wcfg) -and (Select-String -Path $wcfg -Pattern "oauth_token" -Quiet)
Add-Result "no wrangler login left on machine" (-not $loggedIn) $(if ($loggedIn) { "token found (run: npx wrangler logout)" } else { "clean" })

# สรุป
$results | Format-Table -AutoSize -Wrap
$fail = @($results | Where-Object Result -eq "FAIL").Count
$summary = "เครื่อง $env:COMPUTERNAME  ผู้ใช้ $env:USERNAME  $(Get-Date -Format 'yyyy-MM-dd HH:mm')  ->  " + $(if ($fail -eq 0) { "พร้อมใช้ (PASS ทุกข้อ)" } else { "ไม่ผ่าน $fail ข้อ" })
Write-Host ""
Write-Host $summary -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })

$out = Join-Path $PSScriptRoot "check-lab-$env:COMPUTERNAME.txt"
($results | Format-Table -AutoSize -Wrap | Out-String) + "`r`n" + $summary | Out-File -FilePath $out -Encoding utf8
Write-Host "บันทึกผลไว้ที่ $out"
exit $fail
