import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseVoiceAssistantProps {
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
}

export const useVoiceAssistant = ({ onTranscript, onResponse }: UseVoiceAssistantProps = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(
    typeof window !== 'undefined' && 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  );
  
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const initializeRecognition = useCallback(() => {
    console.log('🎤 Initializing speech recognition...');
    console.log('🔍 Browser support check:', {
      isSupported,
      hasSpeechRecognition: 'SpeechRecognition' in window,
      hasWebkitSpeechRecognition: 'webkitSpeechRecognition' in window
    });

    if (!isSupported) {
      console.error('❌ Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('❌ SpeechRecognition constructor not available');
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      console.log('✅ SpeechRecognition instance created');
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        console.log('🎙️ Speech recognition started');
        setIsListening(true);
      };

      recognition.onresult = async (event: any) => {
        console.log('📝 Speech recognition result:', event.results);
        const transcript = event.results[0][0].transcript;
        console.log('✅ Transcript:', transcript);
        
        onTranscript?.(transcript);
        setIsListening(false);
        setIsProcessing(true);
        
        try {
          // Send to AI for processing and get voice response
          const { data, error } = await supabase.functions.invoke('text-to-speech', {
            body: {
              text: transcript,
              voice: 'alloy'
            }
          });

          if (error) throw error;

          if (data?.audioContent) {
            await playAudioResponse(data.audioContent);
            onResponse?.(transcript);
          }
        } catch (error) {
          console.error('Voice processing error:', error);
          toast({
            title: "Voice Processing Error",
            description: "Failed to process voice input. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsProcessing(false);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('🚨 Speech recognition error:', {
          error: event.error,
          message: event.message,
          type: event.type,
          timestamp: new Date().toISOString()
        });
        
        setIsListening(false);
        setIsProcessing(false);
        
        // More specific error handling
        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            toast({
              title: "Microphone Access Issue",
              description: "Please check your browser's microphone permissions and try again.",
              variant: "destructive"
            });
            break;
          case 'network':
            toast({
              title: "Network Error",
              description: "Speech recognition requires an internet connection.",
              variant: "destructive"
            });
            break;
          case 'audio-capture':
            toast({
              title: "Audio Capture Error",
              description: "Unable to capture audio. Check if another app is using the microphone.",
              variant: "destructive"
            });
            break;
          case 'no-speech':
            toast({
              title: "No Speech Detected",
              description: "Please speak clearly and try again.",
              variant: "destructive"
            });
            break;
          default:
            toast({
              title: "Voice Recognition Error",
              description: `Error: ${event.error}. Please try again.`,
              variant: "destructive"
            });
        }
      };

      recognition.onend = () => {
        console.log('🔚 Speech recognition ended');
        setIsListening(false);
      };

      recognition.onnomatch = () => {
        console.log('🤷 No speech match found');
        setIsListening(false);
      };

      recognition.onspeechstart = () => {
        console.log('🗣️ Speech started');
      };

      recognition.onspeechend = () => {
        console.log('🤐 Speech ended');
      };

      return recognition;
    } catch (error) {
      console.error('❌ Failed to create SpeechRecognition:', error);
      setIsSupported(false);
      toast({
        title: "Speech Recognition Unavailable",
        description: "Unable to initialize speech recognition. Please try refreshing the page.",
        variant: "destructive"
      });
      return null;
    }
  }, [isSupported, onTranscript, onResponse, toast]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const startListening = useCallback(async () => {
    console.log('🎯 Starting voice recognition...');
    
    if (!isSupported) {
      console.error('❌ Voice not supported');
      toast({
        title: "Voice Not Supported",
        description: "Voice recognition is not supported in your browser.",
        variant: "destructive"
      });
      return;
    }

    if (isSpeaking) {
      console.log('🔇 Stopping current speech...');
      stopSpeaking();
    }

    // Clean up any existing recognition instance
    if (recognitionRef.current) {
      console.log('🧹 Cleaning up existing recognition instance...');
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (error) {
        console.warn('⚠️ Error stopping existing recognition:', error);
      }
    }

    // Request microphone permission first
    try {
      console.log('🎤 Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone permission granted');
      
      // Stop the stream immediately as we only needed permission
      stream.getTracks().forEach(track => track.stop());
      
      // Now initialize and start recognition
      recognitionRef.current = initializeRecognition();
      
      if (!recognitionRef.current) {
        throw new Error('Failed to initialize speech recognition');
      }
      
      console.log('🚀 Starting speech recognition...');
      recognitionRef.current.start();
      
    } catch (error) {
      console.error('❌ Failed to start voice recognition:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast({
          title: "Microphone Permission Denied",
          description: "Please allow microphone access and try again.",
          variant: "destructive"
        });
      } else if (error.name === 'NotFoundError') {
        toast({
          title: "No Microphone Found", 
          description: "Please connect a microphone and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Voice Recognition Error",
          description: `Failed to start: ${error.message}`,
          variant: "destructive"
        });
      }
    }
  }, [isSupported, isSpeaking, initializeRecognition, toast, stopSpeaking]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const playAudioResponse = useCallback(async (audioBase64: string) => {
    try {
      setIsSpeaking(true);
      
      // Convert base64 to blob
      const binaryString = atob(audioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audioRef.current.play();
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsSpeaking(false);
      toast({
        title: "Audio Playback Error",
        description: "Failed to play audio response.",
        variant: "destructive"
      });
    }
  }, [toast]);


  const speakText = useCallback(async (text: string, voice: string = 'alloy') => {
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice }
      });

      if (error) throw error;

      if (data?.audioContent) {
        await playAudioResponse(data.audioContent);
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
      toast({
        title: "Text-to-Speech Error",
        description: "Failed to convert text to speech.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [playAudioResponse, toast]);

  return {
    isListening,
    isProcessing,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
    stopSpeaking,
    speakText
  };
};