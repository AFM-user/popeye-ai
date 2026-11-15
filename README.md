# Popeye AI

A private AI chat app that runs entirely on your device. There is no account, no server and no cloud. After a one-time model download it works offline, even in Airplane Mode.

**Open it:** https://afm-user.github.io/popeye-ai/

## Install on iPhone (iOS 26 or later)

1. Open the link above in Safari.
2. Tap **Share**, then **Add to Home Screen**.
3. Open Popeye AI from its new Home Screen icon, not from Safari.
4. Tap the model button (top right), pick a model and download it on Wi-Fi. It is about 1 to 2 GB, once.
5. Done. It now works offline.

Safari and the Home Screen app keep separate storage, so download the model from inside the Home Screen app.

## Personas

- 🎲 **Game Master**: a text role-playing adventure with a dice tray, HP, gold and inventory tracking.
- 💬 **Assistant**: general help.
- ✍️ **Story Partner**: co-write fiction.

Add or edit personas from the menu. Each persona has its own instructions, greeting, quick buttons and creativity level.

## How it works

Models run on the phone's graphics chip through [WebLLM](https://github.com/mlc-ai/web-llm) (WebGPU). The app is a static web page. Chats are stored only in this browser's storage on your device, and nothing you type is sent anywhere. Long chats are summarised automatically into a per-chat memory so the model keeps track of the story.
