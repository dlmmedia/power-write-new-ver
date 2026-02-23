'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { playSound } from '@/lib/sounds/sound-engine';
import { clickSoftSound } from '@/lib/sounds/assets/click-soft';
import { switchOnSound } from '@/lib/sounds/assets/switch-on';
import { switchOffSound } from '@/lib/sounds/assets/switch-off';
import { notificationPopSound } from '@/lib/sounds/assets/notification-pop';
import { successChimeSound } from '@/lib/sounds/assets/success-chime';
import { errorBuzzSound } from '@/lib/sounds/assets/error-buzz';
import { back001Sound } from '@/lib/sounds/assets/back-001';
import { hoverTickSound } from '@/lib/sounds/assets/hover-tick';
import { bookOpenSound } from '@/lib/sounds/assets/book-open';
import { bookCloseSound } from '@/lib/sounds/assets/book-close';
import { bookFlip2Sound } from '@/lib/sounds/assets/book-flip-2';
import { bookPlace1Sound } from '@/lib/sounds/assets/book-place-1';

interface SoundContextType {
  muted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  playClick: () => void;
  playSwitchOn: () => void;
  playSwitchOff: () => void;
  playNotification: () => void;
  playSuccess: () => void;
  playError: () => void;
  playBack: () => void;
  playHoverTick: () => void;
  playBookOpen: () => void;
  playBookClose: () => void;
  playBookFlip: () => void;
  playBookPlace: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

const DEFAULT_VOLUME = 0.3;

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState(false);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [mounted, setMounted] = useState(false);
  const mutedRef = useRef(muted);
  const volumeRef = useRef(volume);

  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  useEffect(() => {
    const savedMuted = localStorage.getItem('sound-muted');
    const savedVolume = localStorage.getItem('sound-volume');
    if (savedMuted !== null) setMuted(savedMuted === 'true');
    if (savedVolume !== null) setVolumeState(parseFloat(savedVolume));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('sound-muted', String(muted));
  }, [muted, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('sound-volume', String(volume));
  }, [volume, mounted]);

  const play = useCallback((dataUri: string) => {
    if (mutedRef.current) return;
    playSound(dataUri, { volume: volumeRef.current }).catch(() => {});
  }, []);

  const playClick = useCallback(() => play(clickSoftSound.dataUri), [play]);
  const playSwitchOn = useCallback(() => play(switchOnSound.dataUri), [play]);
  const playSwitchOff = useCallback(() => play(switchOffSound.dataUri), [play]);
  const playNotification = useCallback(() => play(notificationPopSound.dataUri), [play]);
  const playSuccess = useCallback(() => play(successChimeSound.dataUri), [play]);
  const playError = useCallback(() => play(errorBuzzSound.dataUri), [play]);
  const playBack = useCallback(() => play(back001Sound.dataUri), [play]);
  const playHoverTick = useCallback(() => play(hoverTickSound.dataUri), [play]);
  const playBookOpen = useCallback(() => play(bookOpenSound.dataUri), [play]);
  const playBookClose = useCallback(() => play(bookCloseSound.dataUri), [play]);
  const playBookFlip = useCallback(() => play(bookFlip2Sound.dataUri), [play]);
  const playBookPlace = useCallback(() => play(bookPlace1Sound.dataUri), [play]);

  const toggleMute = useCallback(() => setMuted(prev => !prev), []);
  const setVolume = useCallback((v: number) => setVolumeState(Math.max(0, Math.min(1, v))), []);

  return (
    <SoundContext.Provider value={{
      muted,
      volume,
      toggleMute,
      setVolume,
      playClick,
      playSwitchOn,
      playSwitchOff,
      playNotification,
      playSuccess,
      playError,
      playBack,
      playHoverTick,
      playBookOpen,
      playBookClose,
      playBookFlip,
      playBookPlace,
    }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}
