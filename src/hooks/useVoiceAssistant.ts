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
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
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
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setIsProcessing(false);
      
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to use voice features.",
          variant: "destructive"
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  }, [isSupported, onTranscript, onResponse, toast]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast({
        title: "Voice Not Supported",
        description: "Voice recognition is not supported in your browser.",
        variant: "destructive"
      });
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
    }

    try {
      if (!recognitionRef.current) {
        recognitionRef.current = initializeRecognition();
      }
      recognitionRef.current?.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      toast({
        title: "Voice Recognition Error",
        description: "Failed to start voice recognition. Please try again.",
        variant: "destructive"
      });
    }
  }, [isSupported, isSpeaking, initializeRecognition, toast]);

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

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

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