import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { GEMINI_MODEL_LIVE, SAMPLE_RATE_INPUT, FRAME_RATE } from '../constants';
import { ConnectionStatus } from '../types';
import { AudioPlayer } from '../components/AudioPlayer';

interface UseGeminiLiveProps {
  onAudioData: (audioBuffer: AudioBuffer) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const useGeminiLive = ({ onAudioData, videoRef }: UseGeminiLiveProps) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const videoIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const currentKeyRef = useRef<string>(process.env.API_KEY || '');

  useEffect(() => {
    audioPlayerRef.current = new AudioPlayer();
    return () => {
       disconnect();
    }
  }, []);

  const base64Encode = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const createPcmBlob = (data: Float32Array) => {
    const l = data.length;
    // Downsample or process if needed, but 16kHz input is expected.
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      // Clamp values
      const s = Math.max(-1, Math.min(1, data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    const base64 = base64Encode(int16.buffer);
    return {
      data: base64,
      mimeType: `audio/pcm;rate=${SAMPLE_RATE_INPUT}`,
    };
  };

  const sendVideoFrame = async () => {
    if (!videoRef.current || !sessionRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2) return;
    
    // Throttle: don't send if previous send is still pending? 
    // For simplicity, fire and forget, but catch errors.
    
    const canvas = document.createElement('canvas');
    const scale = 0.5;
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Low quality JPEG to reduce bandwidth
    const base64Data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
    
    try {
      await sessionRef.current.sendRealtimeInput({
        media: { data: base64Data, mimeType: 'image/jpeg' }
      });
    } catch (e) { 
      // Ignore frame send errors to prevent flooding console
    }
  };

  const connect = useCallback(async (isCelebrationTime: boolean = false) => {
    if (!currentKeyRef.current) {
        console.error("API Key not found");
        setStatus(ConnectionStatus.ERROR);
        return;
    }

    setStatus(ConnectionStatus.CONNECTING);
    try {
      const ai = new GoogleGenAI({ apiKey: currentKeyRef.current });
      const systemInstruction = isCelebrationTime 
        ? "You are a high-energy Party Host for a New Year's Eve party! It is officially Midnight! Scream 'Happy New Year!', make noise, be super excited, and congratulate everyone. Keep it short."
        : "You are a friendly and cool AI Party Host. You are chatting with guests waiting for the New Year countdown. Be witty, fun, and engaging.";

      // Ensure AudioContext is resumed (browser policy)
      if (inputAudioContextRef.current?.state === 'suspended') {
        await inputAudioContextRef.current.resume();
      }

      const config = {
        responseModalities: [Modality.AUDIO],
        systemInstruction: systemInstruction,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } },
        },
      };

      const sessionPromise = ai.live.connect({
        model: GEMINI_MODEL_LIVE,
        config: config,
        callbacks: {
          onopen: async () => {
            console.log("Gemini Live Connected");
            setStatus(ConnectionStatus.CONNECTED);
            
            try {
               // Setup Input Audio
               const stream = await navigator.mediaDevices.getUserMedia({ 
                   audio: {
                       sampleRate: SAMPLE_RATE_INPUT,
                       channelCount: 1,
                       echoCancellation: true,
                       autoGainControl: true,
                       noiseSuppression: true
                   } 
               });
               streamRef.current = stream;
               
               inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                 sampleRate: SAMPLE_RATE_INPUT
               });
               
               const ctx = inputAudioContextRef.current;
               if (!ctx) return;
               
               mediaStreamSourceRef.current = ctx.createMediaStreamSource(stream);
               scriptProcessorRef.current = ctx.createScriptProcessor(4096, 1, 1);
               
               scriptProcessorRef.current.onaudioprocess = (e) => {
                 if (!sessionRef.current) return;
                 const inputData = e.inputBuffer.getChannelData(0);
                 const pcmBlob = createPcmBlob(inputData);
                 sessionPromise.then(session => {
                     // Fire and forget
                     session.sendRealtimeInput({ media: pcmBlob });
                 });
               };
               
               mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
               scriptProcessorRef.current.connect(ctx.destination);
               
               // Start Video Loop
               if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
               videoIntervalRef.current = window.setInterval(() => {
                  sessionPromise.then(() => sendVideoFrame());
               }, 1000 / FRAME_RATE);
               
            } catch (err) { 
                console.error("Error accessing media", err); 
                setStatus(ConnectionStatus.ERROR);
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              setIsSpeaking(true);
              if (audioPlayerRef.current) {
                  audioPlayerRef.current.play(audioData);
              }
            }
            if (msg.serverContent?.turnComplete) {
              setIsSpeaking(false);
            }
          },
          onclose: () => {
              console.log("Session closed");
              setStatus(ConnectionStatus.DISCONNECTED);
          },
          onerror: (err) => { 
              console.error("Gemini Error", err); 
              setStatus(ConnectionStatus.ERROR); 
              disconnect();
          }
        }
      });
      
      sessionRef.current = await sessionPromise;
      
    } catch (error) {
      console.error("Connection failed", error);
      setStatus(ConnectionStatus.ERROR);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
        // try { sessionRef.current.close(); } catch(e) {} // close() might not exist on session object depending on SDK
        sessionRef.current = null;
    }
    if (inputAudioContextRef.current) { 
        inputAudioContextRef.current.close(); 
        inputAudioContextRef.current = null; 
    }
    if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }
    setStatus(ConnectionStatus.DISCONNECTED);
    setIsSpeaking(false);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
      if (sessionRef.current) {
          try {
            await sessionRef.current.sendRealtimeInput({
                media: { mimeType: 'text/plain', data: btoa(text) }
            });
          } catch (e) {
              console.error("Error sending message", e);
          }
      }
  }, []);

  const setAiMuted = useCallback((muted: boolean) => {
    if (audioPlayerRef.current) {
        audioPlayerRef.current.setMute(muted);
    }
  }, []);

  return { connect, disconnect, status, isSpeaking, sendMessage, setAiMuted };
};