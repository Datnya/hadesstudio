@echo off
echo Extrayendo audio del video...
ffmpeg -i "..\Reel 2 Logra .mp4" -vn -acodec pcm_s16le -ar 16000 -ac 1 "audio_temp.wav" -y
echo Audio extraido!
