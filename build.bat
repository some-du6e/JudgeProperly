@echo off
rd /s /q dist 2>nul
del judgeproperly.zip 2>nul
powershell -command "New-Item -ItemType Directory -Path dist | Out-Null; $include = @('manifest.json','content.js','service-worker.js','icons'); foreach ($item in $include) { Copy-Item $item -Destination 'dist' -Recurse -Force }"
powershell -command "Compress-Archive -Path dist\* -DestinationPath judgeproperly.zip"
echo Done. judgeproperly.zip is ready to upload.