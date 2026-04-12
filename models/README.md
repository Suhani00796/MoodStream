# Model Files Location

Place downloaded model files here:

📁 **models/**
- `model.json` - Model architecture config
- `model_quantized.onnx` - Model weights (~26MB) 
- `tokenizer.json` - Tokenizer configuration

## How to Populate This Folder

See `MODELS_SETUP.md` in the root directory for:
1. Download links for quantized models
2. Step-by-step setup instructions
3. Troubleshooting guide

## File Size Reference

```
model.json           ~100 KB
model_quantized.onnx ~26 MB (quantized = browser-friendly)
tokenizer.json       ~200 KB
─────────────────────────────
Total                ~26.3 MB
```

Browser cache limit: 50MB per origin ✅

## Service Worker Behavior

- If files exist, service worker caches them on install
- If files missing, app falls back to keyword-based detection
- App remains **100% functional** either way

---

**Optional**: The app works perfectly without these files using keyword detection.
