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

To enable the video call AI assistant, you need to set up the following environment variables:

```bash
# OpenAI API Key (for GPT-4o chat responses)
OPENAI_API_KEY=your_openai_api_key_here

# ElevenLabs API Key (for speech synthesis and recognition)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### Getting API Keys:

1. **OpenAI API Key**:
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key
   - Make sure you have access to GPT-4o model

2. **ElevenLabs API Key**:
   - Go to [ElevenLabs](https://elevenlabs.io/)
   - Sign up for an account
   - Get your API key from the profile section

### Browser Requirements:

- **Chrome/Chromium**: Full support for WebRTC and Speech Recognition
- **Safari**: Good support with some limitations
- **Firefox**: Basic support (may have speech recognition limitations)
- **Mobile browsers**: Limited support for video calls

## Development

```bash
npm install
npm run dev
```

## Deployment

The application is deployed on Netlify with Supabase backend integration.