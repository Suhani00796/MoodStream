# 🧠 Model Setup Guide - Optional ML Enhancement

**IMPORTANT:** This is optional. The app works perfectly with keyword-based detection. Only follow this if you want to try ML-based emotion detection.

## Why Download a Model?

The current keyword approach is **fast, reliable, and offline**. However, if you want **more accurate** emotion detection, you can add optional ML support with a quantized model.

## Option 1: Xenova/Distilbert (Recommended for PWA)

### Step 1: Create `/models` Directory
```powershell
mkdir models
```

### Step 2: Download Quantized Model Files

The `Xenova/distilbert-base-uncased-finetuned-emotion` model is optimized for browsers. Download these files:

1. **Model JSON config:** [model.json](https://huggingface.co/Xenova/distilbert-base-uncased-finetuned-emotion/resolve/main/onnx/model.json)
2. **Model weights:** [model_quantized.onnx](https://huggingface.co/Xenova/distilbert-base-uncased-finetuned-emotion/resolve/main/onnx/model_quantized.onnx) (~26MB)
3. **Tokenizer config:** [tokenizer.json](https://huggingface.co/Xenova/distilbert-base-uncased-finetuned-emotion/resolve/main/tokenizer.json)

### Step 3: Place Files in `/models` Folder
```
MoodStream/
├── models/
│   ├── model.json
│   ├── model_quantized.onnx
│   └── tokenizer.json
├── index.html
├── app.js
├── worker.js
└── ...
```

### Step 4: Service Worker Will Cache on First Visit

Once files are in `/models`, the service worker will automatically cache them on installation.

## Option 2: Smaller Models

If 26MB is too large, consider:
- **MicroDistilBERT** (~8MB): Faster but less accurate
- **Keyword-only** (current): Instant, 100% reliable, ultra-lightweight

## Testing

1. **Hard refresh** browser (Ctrl+Shift+R)
2. **Check DevTools** → Network → Look for .onnx file being cached
3. **Turn off internet** → Should still work if cached

## Common Issues

| Problem | Solution |
|---------|----------|
| Model not loading | Check browser console for CORS errors |
| Cache not working | Verify files are actually in `/models` folder |
| App crashes | Check DevTools → Application → Cache Storage |
| 404 on .onnx file | Ensure model files are named exactly matching model.json config |

## Storage Limits

- **Chrome**: ~50MB per origin
- **Firefox**: ~50MB per origin  
- **Safari**: ~50MB per origin

Model (~26MB) + App (~5KB) = ~26MB total ✅

## Rollback to Keyword-Only

If ML models cause issues:
1. Delete `/models` folder
2. Hard refresh browser (Ctrl+Shift+R)
3. App will use pure keyword detection automatically

---

**Note:** We recommend staying with keyword-based detection for hackathons (100% reliability) but offering this for judges who want to see "ML integration" capability.
