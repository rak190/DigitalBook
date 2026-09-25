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
  audioUnavailable?: boolean;
}

export function useAudioPlayer() {
  const [activeTrack, setActiveTrack] = useState<ActiveTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolumeState] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // A/B loop points
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [isLoopActive, setIsLoopActive] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeTrackRef = useRef<ActiveTrack | null>(null);
  activeTrackRef.current = activeTrack;

  const loopRef = useRef<{ loopA: number | null; loopB: number | null; isLoopActive: boolean }>({
    loopA: null,
    loopB: null,
    isLoopActive: false,
  });
  loopRef.current = { loopA, loopB, isLoopActive };

  // Initialize Audio element once
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => {
      const cur = audio.currentTime;
      setCurrentTime(cur);

      // Handle A/B Loop
      const { loopA, loopB, isLoopActive } = loopRef.current;
      if (isLoopActive && loopA !== null && loopB !== null && cur >= loopB) {
        audio.currentTime = loopA;
      }
    };

    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      const { loopA, loopB, isLoopActive } = loopRef.current;
      if (isLoopActive && loopA !== null) {
        audio.currentTime = loopA;
        audio.play().catch(() => {});
      } else {
        setIsPlaying(false);
      }
    };

    const onError = () => {
      // Audio file failed to load -> mark audioUnavailable
      const track = activeTrackRef.current;
      if (track && !track.isTTS) {
        setActiveTrack((prev) =>
          prev ? { ...prev, isTTS: false, audioUnavailable: true } : null
        );
        setIsPlaying(false);
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
  }, []);

  // Web Speech API fallback when explicitly invoked or requested
  const playSpeechSynthesis = useCallback(
    (track: ActiveTrack) => {
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
      const gbVoice =
        voices.find((v) => v.lang.includes('en-GB') || v.lang.includes('en_GB')) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        null;
      if (gbVoice) utterance.voice = gbVoice;

      utterance.onstart = () => {
        setIsPlaying(true);
        setActiveTrack((prev) => (prev ? { ...prev, isTTS: true, audioUnavailable: false } : null));
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
    },
    [playbackRate]
  );

  // Play a track
  const playTrack = useCallback(
    async (track: {
      trackId: string;
      title: string;
      filename: string;
      page?: number;
      transcript?: string;
    }) => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      // Reset loop on new track
      setLoopA(null);
      setLoopB(null);
      setIsLoopActive(false);

      // Check IndexedDB for custom uploaded audio first
      const customBlob = await mediaDB.getCustomAudio(track.trackId);
      let srcUrl = '';

      if (customBlob) {
        srcUrl = URL.createObjectURL(customBlob);
      } else {
        const cleanName = track.filename.trim();
        const finalName = cleanName.endsWith('.mp3') ? cleanName : `${cleanName}.mp3`;
        srcUrl = `${import.meta.env.BASE_URL}audio/${finalName}`;
      }

      const meta = dataService.getAudioTrack(track.trackId);
      const transcriptText = track.transcript || meta?.script || meta?.transcript || '';

      const newTrack: ActiveTrack = {
        ...track,
        transcript: transcriptText,
        isTTS: false,
        audioUnavailable: false,
      };
      setActiveTrack(newTrack);

      if (audioRef.current) {
        audioRef.current.src = srcUrl;
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.volume = isMuted ? 0 : volume;
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            // Audio file was not found
            setActiveTrack((prev) =>
              prev ? { ...prev, audioUnavailable: true } : null
            );
            setIsPlaying(false);
          });
      }
    },
    [playbackRate, volume, isMuted]
  );

  const speakText = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = playbackRate;
      const voices = window.speechSynthesis.getVoices();
      const gbVoice =
        voices.find((v) => v.lang.includes('en-GB')) ||
        voices.find((v) => v.lang.startsWith('en'));
      if (gbVoice) utterance.voice = gbVoice;

      setActiveTrack({
        trackId: 'tts-pronounce',
        title: 'Pronunciation / Listen',
        filename: '',
        isTTS: true,
        transcript: text,
      });
      setIsPlaying(true);

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    },
    [playbackRate]
  );

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
            playSpeechSynthesis(activeTrack);
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
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    }
  }, [activeTrack, isPlaying, playSpeechSynthesis]);

  const seek = useCallback(
    (time: number) => {
      if (audioRef.current && !activeTrack?.isTTS) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
    [activeTrack]
  );

  const skipTime = useCallback(
    (delta: number) => {
      if (audioRef.current && !activeTrack?.isTTS) {
        const next = Math.max(0, Math.min(audioRef.current.currentTime + delta, duration));
        audioRef.current.currentTime = next;
        setCurrentTime(next);
      }
    },
    [duration, activeTrack]
  );

  const changePlaybackRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    setIsMuted(v === 0);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.volume = volume || 1.0;
      }
    } else {
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
    }
  }, [isMuted, volume]);

  const setLoopPointA = useCallback(() => {
    const time = currentTime;
    setLoopA(time);
    if (loopB !== null && loopB > time) {
      setIsLoopActive(true);
    }
  }, [currentTime, loopB]);

  const setLoopPointB = useCallback(() => {
    const time = currentTime;
    setLoopB(time);
    if (loopA !== null && time > loopA) {
      setIsLoopActive(true);
    }
  }, [currentTime, loopA]);

  const clearLoop = useCallback(() => {
    setLoopA(null);
    setLoopB(null);
    setIsLoopActive(false);
  }, []);

  const closePlayer = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setActiveTrack(null);
    clearLoop();
  }, [clearLoop]);

  return {
    activeTrack,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    setVolume,
    toggleMute,
    playTrack,
    speakText,
    playSpeechSynthesis,
    togglePlay,
    seek,
    skipTime,
    changePlaybackRate,
    closePlayer,
    showUploadModal,
    setShowUploadModal,
    loopA,
    loopB,
    isLoopActive,
    setLoopPointA,
    setLoopPointB,
    clearLoop,
  };
}
