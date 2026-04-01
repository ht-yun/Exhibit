# 飞书同步项目：PostgreSQL 安装与配置脚本 (Windows Server)
# 请在目标服务器上以管理员身份运行此脚本

$pgVersion = "16.1-1"
$installerPath = "$env:TEMP\postgresql-installer.exe"
$installDir = "C:\Program Files\PostgreSQL\16"
$dataDir = "C:\PostgresData"
$password = "Ht20070218" # 使用您提供的密码作为数据库超级用户密码

# 1. 下载 PostgreSQL
Write-Host "正在下载 PostgreSQL 安装程序..."
Invoke-WebRequest -Uri "https://get.enterprisedb.com/postgresql/postgresql-$pgVersion-windows-x64.exe" -OutFile $installerPath

# 2. 静默安装
Write-Host "正在安装 PostgreSQL (预计需要几分钟)..."
Start-Process -FilePath $installerPath -ArgumentList "--mode unattended --unattendedmodeui none --substitution_variables_file `"$env:TEMP\pg_install_vars.txt`"" -Wait

# 3. 设置数据目录并初始化（如果尚未完成）
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir
}

# 4. 配置远程访问
Write-Host "正在配置远程访问权限..."
$pgHba = "$dataDir\pg_hba.conf"
$pgConf = "$dataDir\postgresql.conf"

if (Test-Path $pgHba) {
    Add-Content -Path $pgHba -Value "host    all             all             0.0.0.0/0               md5"
}

if (Test-Path $pgConf) {
    (Get-Content $pgConf) -replace "#listen_addresses = 'localhost'", "listen_addresses = '*'" | Set-Content $pgConf
}

# 5. 开启防火墙端口 5432
Write-Host "正在开启防火墙 5432 端口..."
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Allow

# 6. 启动服务
Write-Host "正在启动 PostgreSQL 服务..."
Start-Service -Name "postgresql-x64-16"

Write-Host "PostgreSQL 设置完成！请验证服务器通过 5432 端口的连接。"
