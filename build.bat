@echo off
rd /s /q dist 2>nul
del judgeproperly.zip 2>nul
powershell -command "New-Item -ItemType Directory -Path dist | Out-Null; $exclude = @('dist','build.bat','README.md','LICENSE','.git','.gitignore','privacy.html','judgeproperly.zip'); Get-ChildItem -Path '.' | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object { Copy-Item $_.FullName -Destination 'dist' -Recurse -Force }"
powershell -command "Compress-Archive -Path dist\* -DestinationPath judgeproperly.zip"
echo Done. judgeproperly.zip is ready to upload.