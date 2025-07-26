# PureMind AI - Mental Health Support Platform

A comprehensive mental health support platform with AI-powered chat, video calling, mood tracking, and wellness tools.

## Features

- **AI Chat Assistant**: Text-based conversations with mood analysis
- **Video Call AI**: Real-time video/audio conversations with AI
- **Mood Tracking**: Daily mood monitoring with insights
- **Journal**: Digital journaling with photo memories
- **Addiction Support**: Recovery tracking and daily steps
- **Anxiety Support**: Breathing exercises, meditation, CBT tools
- **Blog Community**: Share stories and connect with others

## Video Call AI Setup

The video call AI assistant uses free, browser-based technologies:

- **Speech Recognition**: Browser's Web Speech API (free)
- **Text-to-Speech**: Browser's Speech Synthesis API (free)
- **AI Chat**: Existing Dappier integration (already configured)
- **Video/Audio**: WebRTC (free browser technology)

### Browser Requirements:

- **Chrome/Chromium**: Full support for WebRTC and Speech Recognition
- **Safari**: Good support with some limitations
- **Firefox**: Basic support (may have speech recognition limitations)
- **Mobile browsers**: Limited support for video calls

### Features:
- Real-time video/audio conversation with AI
- Natural speech recognition and synthesis
- Mood analysis integration
- No API keys required - uses free browser technologies
- Works offline for speech processing
## Development

```bash
npm install
npm run dev
```

## Deployment

The application is deployed on Netlify with Supabase backend integration.