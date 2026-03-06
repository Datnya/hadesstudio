import whisper
import json

model = whisper.load_model("base")
result = model.transcribe("audio_temp.wav", language="es", word_timestamps=True)

# Guardar resultado completo
with open("transcription.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("Transcripcion completa:")
print(result["text"])
print("\nSegmentos:")
for seg in result["segments"]:
    print(f"[{seg['start']:.2f} - {seg['end']:.2f}] {seg['text']}")
