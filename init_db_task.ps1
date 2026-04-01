# 数据库初始化脚本 (在服务器上运行)
# 注意：请确保您已经完成了 PostgreSQL 的安装

$psqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$sqlFile = "C:\Users\Administrator\Desktop\init_db.sql" # 请确保 init_db.sql 此时在您的桌面，或修改此路径
$dbName = "openclaw_data"
$password = "Ht20070218"

# 设置密码环境变量，避免手动输入
$env:PGPASSWORD = $password

Write-Host "--- 正在初始化数据库 ---"

# 1. 创建数据库
& $psqlPath -U postgres -c "CREATE DATABASE $dbName;"

# 2. 运行初始化 SQL
& $psqlPath -U postgres -d $dbName -f $sqlFile

Write-Host "--- 初始化完成！表结构已建好 ---"
