import { useState, useEffect, useRef, useCallback } from 'react';
import { mediaDB } from '../services/storage';
import { dataService } from '../services/dataService';

export interface ActiveTrack {
  trackId: string;
  title: string;
  filename: string;
  page?: number;
  isTTS: boolean;
  transcript?: string;
}

export function useAudioPlayer() {
  const [activeTrack, setActiveTrack] = useState<ActiveTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);
    const onError = () => {
      // Audio file failed to load -> Trigger TTS fallback
      if (activeTrack && !activeTrack.isTTS) {
        fallbackToTTS(activeTrack);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeTrack]);

  // Fallback to Web Speech API TTS
  const fallbackToTTS = useCallback((track: ActiveTrack) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();

    const textToSpeak = track.transcript || track.title || `Audio track ${track.trackId}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = playbackRate;
    
    // Pick British or English voice
    const voices = window.speechSynthesis.getVoices();
    const gbVoice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en_GB')) || 
                    voices.find(v => v.lang.startsWith('en')) || null;
    if (gbVoice) utterance.voice = gbVoice;

    utterance.onstart = () => {
      setIsPlaying(true);
      setActiveTrack(prev => prev ? { ...prev, isTTS: true } : null);
      setDuration(Math.max(5, textToSpeak.split(' ').length * 0.4));
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    ttsUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [playbackRate]);

  // Play a track
  const playTrack = useCallback(async (track: { trackId: string; title: string; filename: string; page?: number; transcript?: string }) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Check IndexedDB for custom uploaded audio first
    const customBlob = await mediaDB.getCustomAudio(track.trackId);
    let srcUrl = '';

    if (customBlob) {
      srcUrl = URL.createObjectURL(customBlob);
    } else {
      // Normal path: /audio/<filename> or /audio/<trackId>.mp3
      srcUrl = `/audio/${track.filename.endsWith('.mp3') ? track.filename : `${track.filename}.mp3`}`;
    }

    const meta = dataService.getAudioTrack(track.trackId);
    const transcriptText = track.transcript || meta?.script || meta?.transcript || '';

    const newTrack: ActiveTrack = {
      ...track,
      transcript: transcriptText,
      isTTS: false,
    };
    setActiveTrack(newTrack);

    if (audioRef.current) {
      audioRef.current.src = srcUrl;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = volume;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // If MP3 not found in /audio/, gracefully fallback to TTS
        fallbackToTTS(newTrack);
      });
    }
  }, [playbackRate, volume, fallbackToTTS]);

  // Speak raw text directly
  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = playbackRate;
    const voices = window.speechSynthesis.getVoices();
    const gbVoice = voices.find(v => v.lang.includes('en-GB')) || voices.find(v => v.lang.startsWith('en'));
    if (gbVoice) utterance.voice = gbVoice;
    
    setActiveTrack({
      trackId: 'tts-pronounce',
      title: 'Pronunciation / Listen',
      filename: '',
      isTTS: true,
      transcript: text
    });
    setIsPlaying(true);

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  }, [playbackRate]);

  const togglePlay = useCallback(() => {
    if (!activeTrack) return;

    if (activeTrack.isTTS) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (isPlaying) {
          window.speechSynthesis.pause();
          setIsPlaying(false);
        } else {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            setIsPlaying(true);
          } else {
            fallbackToTTS(activeTrack);
          }
        }
      }
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  }, [activeTrack, isPlaying, fallbackToTTS]);

  const seek = useCallback((time: number) => {
    if (audioRef.current && !activeTrack?.isTTS) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, [activeTrack]);

  const skipTime = useCallback((delta: number) => {
    if (audioRef.current && !activeTrack?.isTTS) {
      const next = Math.max(0, Math.min(audioRef.current.currentTime + delta, duration));
      audioRef.current.currentTime = next;
      setCurrentTime(next);
    }
  }, [duration, activeTrack]);

  const changePlaybackRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  const closePlayer = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setActiveTrack(null);
  }, []);

  return {
    activeTrack,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    setVolume,
    playTrack,
    speakText,
    togglePlay,
    seek,
    skipTime,
    changePlaybackRate,
    closePlayer,
    showUploadModal,
    setShowUploadModal,
  };
}
