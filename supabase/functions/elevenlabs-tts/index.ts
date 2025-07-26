// deno-lint-ignore-file no-explicit-any
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface TTSRequest {
  text: string;
  voice_id?: string;
  model_id?: string;
  voice_settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

// Default voice IDs (you can customize these)
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel - calm, friendly female voice
const ALTERNATIVE_VOICES = {
  "rachel": "21m00Tcm4TlvDq8ikWAM", // Calm, friendly female
  "adam": "pNInz6obpgDQGcFmaJgB",   // Deep, confident male
  "bella": "EXAVITQu4vr4xnSDxMaL",  // Young, energetic female
  "josh": "TxGEqnHWrfWFTfGW9XjX",   // Warm, caring male
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { 
      text, 
      voice_id = DEFAULT_VOICE_ID,
      model_id = "eleven_monolingual_v1",
      voice_settings = {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    }: TTSRequest = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Clean text for better speech synthesis
    const cleanedText = text
      .replace(/[*_`]/g, '') // Remove markdown
      .replace(/\n+/g, ' ') // Replace line breaks with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (cleanedText.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Text too long (max 1000 characters)" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Resolve voice ID if it's a name
    const resolvedVoiceId = ALTERNATIVE_VOICES[voice_id as keyof typeof ALTERNATIVE_VOICES] || voice_id;

    // Call ElevenLabs API
    const elevenlabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: cleanedText,
          model_id: model_id,
          voice_settings: voice_settings,
        }),
      }
    );

    if (!elevenlabsResponse.ok) {
      const errorText = await elevenlabsResponse.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${elevenlabsResponse.status}`);
    }

    // Return the audio stream
    const audioBuffer = await elevenlabsResponse.arrayBuffer();
    
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error: any) {
    console.error('Error in ElevenLabs TTS function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate speech",
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});