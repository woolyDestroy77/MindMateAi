import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

export const useVoiceInput = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setIsProcessing(true);
      
      // Check if speech recognition is supported
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Configure recognition settings
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      // Reset transcript
      finalTranscriptRef.current = '';
      setTranscript('');

      recognition.onstart = () => {
        setIsRecording(true);
        setIsProcessing(false);
        toast.success('Voice recording started. Speak now!');
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = finalTranscriptRef.current;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        finalTranscriptRef.current = finalTranscript;
        const fullTranscript = (finalTranscript + interimTranscript).trim();
        setTranscript(fullTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setIsProcessing(false);
        
        let errorMessage = 'Voice recognition failed. ';
        switch (event.error) {
          case 'no-speech':
            errorMessage += 'No speech was detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage += 'No microphone was found. Please check your microphone settings.';
            break;
          case 'not-allowed':
            errorMessage += 'Microphone access was denied. Please allow microphone access and try again.';
            break;
          case 'network':
            errorMessage += 'Network error occurred. Please check your internet connection.';
            break;
          case 'aborted':
            errorMessage += 'Recording was stopped.';
            break;
          default:
            errorMessage += `Error: ${event.error}`;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setIsProcessing(false);
        
        if (finalTranscriptRef.current.trim()) {
          toast.success('Voice recording completed!');
        }
      };

      // Request microphone permission first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognition.start();
        recognitionRef.current = recognition;
        return recognition;
      } catch (permissionError) {
        setIsProcessing(false);
        throw new Error('Microphone access denied. Please allow microphone access to use voice input.');
      }

    } catch (err: any) {
      setIsProcessing(false);
      const errorMessage = err.message || 'Failed to start voice recording';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const stopRecording = useCallback((recognition?: any) => {
    const recognitionToStop = recognition || recognitionRef.current;
    
    if (recognitionToStop) {
      recognitionToStop.stop();
      recognitionRef.current = null;
    }
    
    setIsRecording(false);
    setIsProcessing(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    finalTranscriptRef.current = '';
    setError(null);
  }, []);

  return {
    isRecording,
    transcript,
    error,
    isProcessing,
    startRecording,
    stopRecording,
    clearTranscript,
  };
};