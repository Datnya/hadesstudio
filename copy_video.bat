@echo off
echo Copiando video al proyecto...
if not exist "public" mkdir public
copy "..\Reel 2 Logra .mp4" "public\video.mp4"
echo Listo!
