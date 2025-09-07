import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

export const useVoiceInput = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const finalTranscriptRef = useRef('');
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setIsProcessing(true);
      setRecordingDuration(0);
      
      // Check if speech recognition is supported
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
      }

      // Request microphone permission and get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio recording with widely supported format
      audioChunksRef.current = [];
      
      // Determine the best supported MIME type
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = ''; // Let the browser choose
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Use the same MIME type that was used for recording
        const finalMimeType = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      // Set up speech recognition for text conversion
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      finalTranscriptRef.current = '';
      setTranscript('');

      recognition.onstart = () => {
        setIsRecording(true);
        setIsProcessing(false);
        
        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
        
        toast.success('Recording voice message...');
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
        
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        
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
        
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        
        if (finalTranscriptRef.current.trim()) {
          toast.success('Voice message recorded!');
        }
      };

      // Start both audio recording and speech recognition
      mediaRecorder.start();
      recognition.start();
      recognitionRef.current = recognition;
      
      return recognition;

    } catch (err: any) {
      setIsProcessing(false);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      const errorMessage = err.message || 'Failed to start voice recording';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const stopRecording = useCallback((recognition?: any) => {
    const recognitionToStop = recognition || recognitionRef.current;
    
    if (recognitionToStop && typeof recognitionToStop.stop === 'function') {
      recognitionToStop.stop();
      recognitionRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    setIsRecording(false);
    setIsProcessing(false);
  }, []);

  const clearRecording = useCallback(() => {
    setTranscript('');
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordingDuration(0);
    finalTranscriptRef.current = '';
    setError(null);
  }, [audioUrl]);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRecording,
    transcript,
    error,
    isProcessing,
    audioBlob,
    audioUrl,
    recordingDuration,
    startRecording,
    stopRecording,
    clearRecording,
    formatDuration,
  };
};