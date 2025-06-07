import { useState, useCallback } from 'react';

export const useVoiceInput = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setTranscript(transcript);
      };

      recognition.onerror = (event) => {
        setError(event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      setIsRecording(true);

      return recognition;
    } catch (err) {
      setError('Speech recognition not supported in this browser');
      return null;
    }
  }, []);

  const stopRecording = useCallback((recognition: any) => {
    if (recognition) {
      recognition.stop();
    }
    setIsRecording(false);
  }, []);

  return {
    isRecording,
    transcript,
    error,
    startRecording,
    stopRecording,
  };
};