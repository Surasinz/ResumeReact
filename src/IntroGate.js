import { useCallback, useEffect, useRef, useState } from 'react';
import accessGrantedVideo from './assets/intro/access_granted.webm';
import approachLoginVideo from './assets/intro/approach_login.webm';
import idleLoopVideo from './assets/intro/idle_loop.webm';
import introPoster from './assets/intro/intro-poster.webp';
import './IntroGate.css';
import { LocalizedText, useLanguage } from './LanguageSystem';

export const INTRO_SESSION_KEY = 'surachet-intro-seen';
export const EXIT_SECONDS = 0.55;
export const VIDEO_TIMEOUT_MS = 9000;

const CLIPS = {
  idle: idleLoopVideo,
  approach: approachLoginVideo,
  access: accessGrantedVideo,
};

export function hasSeenIntro() {
  try {
    return window.sessionStorage.getItem(INTRO_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, 'true');
  } catch {
    // The gate can still dismiss for this page view when storage is blocked.
  }
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function getNextVideoPhase(phase) {
  if (phase === 'approach') return 'access';
  if (phase === 'access') return 'exiting';
  return phase;
}

export default function IntroGate({ onEnter }) {
  const { language, t } = useLanguage();
  const [phase, setPhase] = useState('idle');
  const [visibleClip, setVisibleClip] = useState('idle');
  const enteredRef = useRef(false);
  const skipRef = useRef(null);
  const videoRefs = useRef({});
  const videoRefCallbacks = useRef(null);
  const phaseRef = useRef(phase);
  const reducedMotionRef = useRef(prefersReducedMotion());
  phaseRef.current = phase;

  if (!videoRefCallbacks.current) {
    videoRefCallbacks.current = Object.keys(CLIPS).reduce((callbacks, clipPhase) => {
      callbacks[clipPhase] = (node) => {
        if (node) {
          videoRefs.current[clipPhase] = node;
        } else {
          videoRefs.current[clipPhase]?.pause();
          delete videoRefs.current[clipPhase];
        }
      };
      return callbacks;
    }, {});
  }

  const enterNow = useCallback(() => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    onEnter();
  }, [onEnter]);

  const advanceFrom = useCallback((clipPhase) => {
    setPhase((current) => (
      current === clipPhase ? getNextVideoPhase(current) : current
    ));
  }, []);

  const begin = useCallback(() => {
    if (reducedMotionRef.current) {
      enterNow();
      return;
    }
    setPhase((current) => (current === 'idle' ? 'approach' : current));
  }, [enterNow]);

  useEffect(() => {
    const video = videoRefs.current[phase];
    if (!video) return undefined;

    if (phase !== 'idle') video.currentTime = 0;
    const playback = video.play();
    playback?.catch(() => {
      if (phase !== 'idle') advanceFrom(phase);
    });
  }, [phase, advanceFrom]);

  useEffect(() => {
    if (phase !== 'approach' && phase !== 'access') return undefined;

    // A corrupt download or a browser that never emits `ended` must not trap
    // the visitor inside the intro.
    const watchdog = window.setTimeout(
      () => advanceFrom(phase),
      VIDEO_TIMEOUT_MS
    );
    return () => window.clearTimeout(watchdog);
  }, [phase, advanceFrom]);

  useEffect(() => {
    if (phase !== 'exiting') return undefined;
    const timer = window.setTimeout(enterNow, EXIT_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [phase, enterNow]);

  useEffect(() => {
    if (phase === 'approach') {
      skipRef.current?.focus({ preventScroll: true });
    }
  }, [phase]);

  useEffect(() => () => {
    Object.values(videoRefs.current).forEach((video) => video.pause());
  }, []);

  const status = phase === 'approach'
    ? t('intro_zooming')
    : phase === 'access'
      ? t('intro_loading')
      : phase === 'exiting'
        ? t('intro_opening')
        : '';

  return (
    <div className="intro-gate" data-phase={phase}>
      <div className="intro-stage" aria-hidden="true">
        <img
          className="intro-poster"
          src={introPoster}
          alt=""
          decoding="async"
        />
        {Object.entries(CLIPS).map(([clipPhase, src]) => (
          <video
            key={clipPhase}
            ref={videoRefCallbacks.current[clipPhase]}
            className={`intro-video${visibleClip === clipPhase ? ' is-active' : ''}`}
            data-testid={`intro-video-${clipPhase}`}
            src={src}
            poster={clipPhase === 'idle' ? introPoster : undefined}
            preload="auto"
            autoPlay={clipPhase === 'idle'}
            loop={clipPhase === 'idle'}
            muted
            playsInline
            disablePictureInPicture
            onPlaying={() => {
              if (phaseRef.current !== clipPhase) return;
              setVisibleClip(clipPhase);
              Object.entries(videoRefs.current).forEach(([key, video]) => {
                if (key !== clipPhase) video.pause();
              });
            }}
            onEnded={() => advanceFrom(clipPhase)}
            onError={() => {
              if (clipPhase !== 'idle') advanceFrom(clipPhase);
            }}
          />
        ))}
        <div className="intro-video-grade" />
      </div>

      <div className="intro-menu" aria-hidden={phase !== 'idle'}>
        <p className="intro-menu-title">
          SURACHET<span>.</span>
        </p>
        <p className="intro-menu-sub">SOFTWARE ENGINEER // PORTFOLIO</p>
        <button
          type="button"
          className="intro-next"
          onClick={begin}
          disabled={phase !== 'idle'}
          tabIndex={phase === 'idle' ? 0 : -1}
          lang={language}
          aria-label={t('intro_enter')}
        >
          <LocalizedText i18nKey="intro_next" />
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <p className="intro-status" role="status" aria-live="polite" lang={language}>
        {status}
      </p>

      <button
        ref={skipRef}
        type="button"
        className="intro-skip"
        onClick={enterNow}
        lang={language}
      >
        <LocalizedText i18nKey="intro_skip" />
      </button>
    </div>
  );
}
