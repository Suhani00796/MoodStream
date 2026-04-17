# Chat Logic Refactor: Timer → Message Counter

## What Changed

### Before (1:30 Timer)
- User logs in
- Timer starts: 90-second countdown with visual progress bar
- User sends messages freely during countdown
- When timer hits 0:00, Leo analyzes all messages and launches vibe hub
- **Issue**: Feels artificial, uses timer metaphor for conversation

### After (8-Message Counter) ✅
- User logs in
- Message counter shows: "8 left", "7 left", "6 left"... 
- User sends messages, Leo responds contextually
- After exactly 8 messages, Leo stops and shows vibe hub
- **UX Benefit**: Predictable, conversation-based, cleaner

---

## Code Changes

### 1. Constructor
```javascript
// OLD
this.timerInterval = null;

// NEW
this.messageCount = 0;
this.maxMessages = 8;
this.fullChatLog = "";
```

### 2. Start Conversation
```javascript
// OLD
startContinuousVibe() {
    let secondsLeft = 90;
    const progressTimer = setInterval(() => {
        secondsLeft--;
        this.updateTimerUI(secondsLeft);
        if (secondsLeft <= 0) {
            clearInterval(progressTimer);
            this.handleConversationEnd();
        }
    }, 1000);
}

// NEW
startContinuousVibe() {
    this.addBotMessage("...");
    this.messageCount = 0;
    this.fullChatLog = "";
    this.updateCounterUI(this.maxMessages);
}
```

### 3. Update UI
```javascript
// OLD: updateTimerUI(secondsLeft)
// Shows M:SS countdown

// NEW: updateCounterUI(messagesLeft)
// Shows "X left" and progress bar
const percentage = ((this.maxMessages - messagesLeft) / this.maxMessages) * 100;
```

### 4. Handle User Message
```javascript
// OLD: handleLeoChat() just showed responses

// NEW: handleLeoChat()
async handleLeoChat(userMessage) {
    this.messageCount++;           // Count it
    this.fullChatLog += message;  // Log it
    
    const leoResponse = this.getSmartResponse(userMessage);
    this.addBotMessage(leoResponse);
    
    if (this.messageCount >= 8) {  // Check trigger
        this.processFinalVibe();
        return;
    }
    
    this.updateCounterUI(8 - this.messageCount);  // Update counter
}
```

### 5. Leo's Smart Response
```javascript
getSmartResponse(input) {
    const text = input.toLowerCase();
    
    if (text.includes("eat") || text.includes("hungry")) {
        return "Food is the best love language! ...";
    }
    if (text.includes("sad") || text.includes("lonely")) {
        return "I'm right here with you. ...";
    }
    if (text.includes("busy") || text.includes("study")) {
        return "The hustle is real! ...";
    }
    
    // Fallback: random filler response
    return fillers[Math.random() * fillers.length];
}
```

### 6. Final Vibe Trigger
```javascript
// OLD: handleConversationEnd() - called after timer

// NEW: processFinalVibe() - called after 8 messages
async processFinalVibe() {
    this.addBotMessage("That's 8! 🛑 I've read your vibes perfectly...");
    
    const mood = await moodDetector.getMood(this.fullChatLog);
    this.launchVibeHub(mood);
}
```

---

## Conversation Flow

```
User: "Hey Leo!"
↓ Message 1
Leo: "Tell me more, sweetie. I'm all ears... ✨"

User: "I'm feeling sad today"
↓ Message 2
Leo: "I'm right here with you. Tell me what's weighing on your heart... 🫂"
UI shows: "6 left"

User: "Food helps me feel better"
↓ Message 3
Leo: "Food is the best love language! What's your go-to comfort meal? 🍕"
UI shows: "5 left"

... continues ...

User: "Thanks for listening, you're amazing"
↓ Message 8 (TRIGGER!)
Leo: "That's 8! 🛑 I've read your vibes perfectly. Here is your escape plan..."
↓
Mood Analysis: sadness (detected from full chat)
↓
Vibe Hub Card:
  🎵 Play Music → "Soulful Hindi Sad Songs" 
  🚀 Launch Amazon
```

---

## Benefits

| Aspect | Before (Timer) | After (Messages) |
|--------|---|---|
| **Predictability** | Unclear when vibe hub will appear | Exactly after 8 messages ✅ |
| **User Control** | Rushed by timer | Natural conversation flow ✅ |
| **Intent** | Forces conversation duration | Specific interaction count ✅ |
| **UX Feel** | Gamified timer | Confident chatbot ✅ |
| **Code** | Complex interval logic | Simple counter logic ✅ |

---

## Files Updated

- `app.js`:
  - Removed timer variables: `timerInterval`, `conversationTimer`
  - Added counter variables: `messageCount`, `maxMessages`, `fullChatLog`
  - `startContinuousVibe()` → message-based initialization
  - `updateTimerUI()` → `updateCounterUI()`
  - `handleConversationEnd()` → `processFinalVibe()`
  - New method: `getSmartResponse()`
  - Updated `handleLeoChat()` with message counting

---

## Testing Checklist

- [ ] Click "Get OTP" and verify login
- [ ] Wait for model to load, chat starts
- [ ] UI shows "8 left" in progress container
- [ ] Send "Hey Leo!" → Leo responds, UI shows "7 left"
- [ ] Send 6 more messages (any content)
- [ ] After message 8 → Leo says "That's 8! 🛑" and shows vibe hub
- [ ] Vibe Hub shows detected mood + YouTube link + app button
- [ ] Click buttons → open in new tabs

---

## Updated URLs (YouTube Queries)

- Romantic → "Bollywood Romantic Hits" (was: "romantic bollywood")
- Sadness → "Soulful Hindi Sad Songs" (was: "sad hindi soulful")
- Joy → "Happy Upbeat Bollywood Mix" (was: "bhakti songs")
- Love → "Love Songs Bollywood" (was: "love songs bollywood")
- Surprise → "Upbeat Party Dance Mix" (was: "party dance songs")
- Fear → "Lofi Focus Study Music" (was: "lofi study focus")
- Anger → "Gym Workout Music" (was: "gym workout music")

---

## Commit Info

- **Hash**: `1e99efa`
- **Branch**: `main`
- **Date**: 2026-04-17
- **Message**: "refactor: Replace timer with 8-message counting system"
