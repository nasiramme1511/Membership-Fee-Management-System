$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dataDir = "C:\xampp\mysql\data"
$backupDir = "C:\xampp\mysql\backup"
$corruptDir = "C:\xampp\mysql\data_corrupted_$timestamp"

Write-Host "Renaming $dataDir to $corruptDir..."
Rename-Item -Path $dataDir -NewName $corruptDir

Write-Host "Copying $backupDir to $dataDir..."
Copy-Item -Path $backupDir -Destination $dataDir -Recurse

Write-Host "Copying user databases..."
$exclude = @("mysql", "performance_schema", "phpmyadmin")
Get-ChildItem -Path $corruptDir -Directory | Where-Object { $_.Name -notin $exclude } | ForEach-Object {
    Write-Host "Copying database folder: $_.Name"
    Copy-Item -Path $_.FullName -Destination $dataDir -Recurse -Force
}

Write-Host "Copying ibdata1..."
if (Test-Path "$corruptDir\ibdata1") {
    Copy-Item -Path "$corruptDir\ibdata1" -Destination "$dataDir\ibdata1" -Force
}

Write-Host "MySQL data directory restored successfully!"
