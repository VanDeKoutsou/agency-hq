import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Target,
  StickyNote,
  Flame,
  Music,
  Link2,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Upload,
  X,
} from 'lucide-react';
import { notify, todayStr } from '../lib/utils';
import { Button, cx } from './ui';

const PRESETS = [
  { label: 'Pomodoro', mins: 25 },
  { label: 'Deep Work', mins: 50 },
  { label: 'Flow State', mins: 90 },
  { label: 'Διάλειμμα', mins: 5 },
];

const THEMES = [
  {
    id: 'espresso',
    name: 'Warm Coffee',
    type: 'gradient',
    style: { background: 'radial-gradient(circle at 20% 20%, #3d2c22 0%, #1c1512 55%, #0d0a09 100%)' },
  },
  {
    id: 'midnight',
    name: 'OLED Midnight',
    type: 'gradient',
    style: { background: 'radial-gradient(circle at 80% 20%, #1e293b 0%, #090d16 60%, #020408 100%)' },
  },
  {
    id: 'forest',
    name: 'Forest Mist',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'rain',
    name: 'Night Rain',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'cabin',
    name: 'Cozy Desk',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1920&q=80',
  },
];

const DEFAULT_SPOTIFY =
  'https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0';

function toSpotifyEmbed(url) {
  const match = url.match(
    /open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|track|episode|show)\/([a-zA-Z0-9]+)/
  );
  if (!match) return null;
  return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
}

// Συμπίεση εικόνας από τη συλλογή ώστε να αποθηκεύεται με ασφάλεια στο localStorage
function compressImage(file, maxWidth = 1920, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function FocusArea({ tasks, isActive = true }) {
  const today = todayStr();

  // --- Timer State ---
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [customMins, setCustomMins] = useState('');

  // --- Goal State ---
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [customGoal, setCustomGoal] = useState('');

  // --- Brain Dump ---
  const [brainDump, setBrainDump] = useState(() => localStorage.getItem('focus_brain_dump') || '');

  // --- Spotify State ---
  const [spotifyEmbedUrl, setSpotifyEmbedUrl] = useState(
    () => localStorage.getItem('focus_spotify_url') || DEFAULT_SPOTIFY
  );
  const [spotifyInput, setSpotifyInput] = useState('');
  const [zenSpotifyOpen, setZenSpotifyOpen] = useState(false);

  // --- Cozy Themes & Custom Wallpaper ---
  const [themeId, setThemeId] = useState(() => localStorage.getItem('focus_theme_id') || 'espresso');
  const [customBgUrl, setCustomBgUrl] = useState(() => localStorage.getItem('focus_custom_bg') || '');
  const [bgInput, setBgInput] = useState('');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const themePickerRef = useRef(null);
  const themeBtnRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- StandBy / Zen Mode State ---
  const [manualZen, setManualZen] = useState(false);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [showZenControls, setShowZenControls] = useState(true);
  const hideTimerRef = useRef(null);
  const wakeLockRef = useRef(null);

  const isZenMode = isActive && (manualZen || isMobileLandscape);

  // --- Daily Stats ---
  const statsKey = `focus_stats_${today}`;
  const [stats, setStats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(statsKey)) || { sessions: 0, minutes: 0 };
    } catch {
      return { sessions: 0, minutes: 0 };
    }
  });

  const todaysTasks = useMemo(() => {
    if (!tasks?.rows) return [];
    return tasks.rows.filter((t) => t.task_date === today && !t.is_backlog);
  }, [tasks?.rows, today]);

  // Persist local preferences
  useEffect(() => localStorage.setItem('focus_brain_dump', brainDump), [brainDump]);
  useEffect(() => localStorage.setItem(statsKey, JSON.stringify(stats)), [stats, statsKey]);
  useEffect(() => localStorage.setItem('focus_spotify_url', spotifyEmbedUrl), [spotifyEmbedUrl]);
  useEffect(() => localStorage.setItem('focus_theme_id', themeId), [themeId]);
  useEffect(() => {
    try {
      localStorage.setItem('focus_custom_bg', customBgUrl);
    } catch {
      notify('Η εικόνα είναι πολύ μεγάλη για αποθήκευση. Δοκίμασε μια μικρότερη.');
    }
  }, [customBgUrl]);

  // Click-outside για κλείσιμο του Theme Picker
  useEffect(() => {
    if (!showThemePicker) return;
    function handleClickOutside(e) {
      if (
        themePickerRef.current &&
        !themePickerRef.current.contains(e.target) &&
        themeBtnRef.current &&
        !themeBtnRef.current.contains(e.target)
      ) {
        setShowThemePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showThemePicker]);

  // Auto-detect mobile landscape for StandBy Mode
  useEffect(() => {
    const checkOrientation = () => {
      const landscape = window.innerWidth > window.innerHeight && window.innerHeight <= 520;
      setIsMobileLandscape(landscape);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Lock body scroll & handle Esc key in Zen Mode
  useEffect(() => {
    if (!isZenMode) {
      document.body.style.overflow = '';
      setZenSpotifyOpen(false);
      setShowThemePicker(false);
      return;
    }

    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') exitZenMode();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isZenMode]);

  // Screen Wake Lock
  useEffect(() => {
    async function requestWakeLock() {
      if (!('wakeLock' in navigator)) return;
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch {
        // ignore
      }
    }

    if (isZenMode || isRunning) {
      requestWakeLock();
    } else if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isZenMode, isRunning]);

  // Auto-hide controls in Zen Mode after 3.5s
  function resetHideTimer() {
    setShowZenControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (!zenSpotifyOpen && !showThemePicker) {
      hideTimerRef.current = setTimeout(() => setShowZenControls(false), 3500);
    }
  }

  useEffect(() => {
    if (isZenMode) {
      resetHideTimer();
    } else if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isZenMode, zenSpotifyOpen, showThemePicker]);

  function enterZenMode() {
    setManualZen(true);
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  function exitZenMode() {
    setManualZen(false);
    setZenSpotifyOpen(false);
    setShowThemePicker(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // ignore
    }
  }

  // Countdown Logic
  useEffect(() => {
    if (!isRunning) {
      document.title = 'Agency HQ';
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          playChime();
          const completedMins = Math.round(totalSeconds / 60);
          setStats((s) => ({ sessions: s.sessions + 1, minutes: s.minutes + completedMins }));
          notify(`🎉 Τέλος Focus Session (${completedMins} λεπτά)!`);
          document.title = '✅ Τέλος Session!';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, totalSeconds]);

  useEffect(() => {
    if (isRunning) {
      const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
      const s = String(secondsLeft % 60).padStart(2, '0');
      document.title = `⏱️ ${m}:${s} · Focus`;
    }
    return () => {
      if (!isRunning) document.title = 'Agency HQ';
    };
  }, [secondsLeft, isRunning]);

  function selectPreset(mins) {
    setIsRunning(false);
    setTotalSeconds(mins * 60);
    setSecondsLeft(mins * 60);
  }

  function applyCustomTime(e) {
    e.preventDefault();
    const mins = parseInt(customMins, 10);
    if (!mins || mins <= 0 || mins > 240) return;
    selectPreset(mins);
    setCustomMins('');
  }

  function handleSpotifySubmit(e) {
    e.preventDefault();
    const embed = toSpotifyEmbed(spotifyInput.trim());
    if (!embed) {
      return notify('Βάλε ένα έγκυρο link από Spotify (playlist, album, track ή podcast).');
    }
    setSpotifyEmbedUrl(embed);
    setSpotifyInput('');
    notify('Η playlist ενημερώθηκε!');
  }

  function handleCustomBgSubmit(e) {
    e.preventDefault();
    if (!bgInput.trim().startsWith('http')) {
      return notify('Βάλε ένα έγκυρο URL εικόνας (https://...)');
    }
    setCustomBgUrl(bgInput.trim());
    setThemeId('custom');
    setBgInput('');
    setShowThemePicker(false);
    notify('Το wallpaper ενημερώθηκε!');
  }

  async function handleGalleryUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setCustomBgUrl(dataUrl);
      setThemeId('custom');
      setShowThemePicker(false);
      notify('Η φωτογραφία ορίστηκε ως wallpaper!');
    } catch {
      notify('Αποτυχία φόρτωσης εικόνας.');
    } finally {
      e.target.value = '';
    }
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  const activeGoalText = selectedTaskId
    ? todaysTasks.find((t) => t.id === selectedTaskId)?.title
    : customGoal;

  const activeTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const bgStyle =
    themeId === 'custom' && customBgUrl
      ? { backgroundImage: `url(${customBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : activeTheme.type === 'image'
      ? { backgroundImage: `url(${activeTheme.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : activeTheme.style;

  return (
    <div
      className={cx(
        'transition-all duration-500',
        isZenMode
          ? 'fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden select-none'
          : 'animate-fadeIn grid gap-5 sm:gap-6 lg:grid-cols-3'
      )}
      style={isZenMode ? bgStyle : undefined}
      onMouseMove={isZenMode ? resetHideTimer : undefined}
      onTouchStart={isZenMode ? resetHideTimer : undefined}
      onClick={isZenMode ? resetHideTimer : undefined}
    >
      {/* Σκούρο απαλό overlay στο Zen Mode */}
      {isZenMode && <div className="pointer-events-none absolute inset-0 bg-black/45 backdrop-blur-[2px]" />}

      {/* --- ΚΥΡΙΑ ΣΤΗΛΗ / TIMER --- */}
      <div
        className={cx(
          isZenMode
            ? 'relative z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center'
            : 'lg:col-span-2 space-y-5 sm:space-y-6'
        )}
      >
        <div
          className={cx(
            'relative overflow-hidden transition-all duration-500',
            isZenMode
              ? 'flex w-full max-w-3xl flex-col items-center justify-center'
              : 'rounded-3xl p-5 sm:p-8 text-white shadow-xl'
          )}
          style={!isZenMode ? bgStyle : undefined}
        >
          {!isZenMode && <div className="pointer-events-none absolute inset-0 bg-black/40 backdrop-blur-[1px]" />}

          {/* Progress Bar */}
          <div
            className={cx(
              'left-0 right-0 z-20 h-1 bg-white/10',
              isZenMode ? 'fixed bottom-0' : 'absolute top-0'
            )}
          >
            <div
              className="h-full bg-amber-300/90 transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="relative z-10 w-full">
            {/* Top Bar σε Normal Mode */}
            {!isZenMode && (
              <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => selectPreset(p.mins)}
                      className={cx(
                        'rounded-xl px-3 py-2 text-xs font-medium transition-all backdrop-blur-md border sm:rounded-full sm:py-1.5',
                        totalSeconds === p.mins * 60
                          ? 'bg-white text-stone-900 border-white shadow-sm font-semibold'
                          : 'bg-white/10 text-white/85 border-white/15 hover:bg-white/20'
                      )}
                    >
                      {p.label} · {p.mins}'
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <form onSubmit={applyCustomTime} className="flex items-center gap-1.5">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="240"
                      placeholder="Λεπτά"
                      value={customMins}
                      onChange={(e) => setCustomMins(e.target.value)}
                      className="w-16 rounded-xl border border-white/20 bg-white/10 px-2 py-1.5 text-center text-xs text-white placeholder-white/50 outline-none backdrop-blur-md focus:border-white/50"
                    />
                    <button
                      type="submit"
                      disabled={!customMins}
                      className="rounded-xl bg-white/15 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-md transition hover:bg-white/25 disabled:opacity-40"
                    >
                      ΟΚ
                    </button>
                  </form>

                  <button
                    ref={themeBtnRef}
                    onClick={() => setShowThemePicker((v) => !v)}
                    className="rounded-xl bg-white/15 p-2 text-white backdrop-blur-md transition hover:bg-white/25"
                    title="Αλλαγή Wallpaper / Theme"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>

                  <button
                    onClick={enterZenMode}
                    className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/30"
                    title="Full-Screen StandBy / Zen Mode"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Zen Mode</span>
                  </button>
                </div>
              </div>
            )}

            {/* Theme Picker Drawer (Κλείνει με click έξω) */}
            {!isZenMode && showThemePicker && (
              <div
                ref={themePickerRef}
                className="mb-6 rounded-2xl border border-white/15 bg-black/60 p-3.5 backdrop-blur-xl animate-fadeIn space-y-3"
              >
                <div className="flex flex-wrap gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setThemeId(t.id);
                        setShowThemePicker(false);
                      }}
                      className={cx(
                        'rounded-lg px-2.5 py-1 text-xs font-medium transition border',
                        themeId === t.id
                          ? 'bg-amber-200 text-stone-900 border-amber-200'
                          : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/20'
                      )}
                    >
                      {t.name}
                    </button>
                  ))}

                  {/* Επιλογή φωτογραφίας από Συλλογή κινητού / PC */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cx(
                      'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition border',
                      themeId === 'custom'
                        ? 'bg-amber-200 text-stone-900 border-amber-200'
                        : 'bg-white/20 text-white border-white/20 hover:bg-white/30'
                    )}
                  >
                    <Upload className="h-3.5 w-3.5" /> Από Συλλογή
                  </button>
                </div>

                <form onSubmit={handleCustomBgSubmit} className="flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs text-white placeholder-white/50 outline-none focus:border-white/40"
                    placeholder="Ή βάλε image URL (https://...)"
                    value={bgInput}
                    onChange={(e) => setBgInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30"
                  >
                    Εφαρμογή
                  </button>
                </form>
              </div>
            )}

            {/* Ενεργός Στόχος */}
            <div className={cx('text-center', isZenMode ? 'mb-3' : 'mb-3')}>
              {activeGoalText ? (
                <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium text-amber-100 backdrop-blur-md">
                  <Target className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                  <span className="truncate">{activeGoalText}</span>
                </div>
              ) : (
                !isZenMode && (
                  <p className="text-xs text-white/60">Επίλεξε στόχο παρακάτω & πάτα Έναρξη</p>
                )
              )}
            </div>

            {/* Τεράστιο Minimal Χρονόμετρο (Απόλυτα κεντραρισμένο) */}
            <div className={cx('text-center', isZenMode ? '' : 'my-5 sm:my-7')}>
              <div
                className={cx(
                  'font-timer font-light tracking-tight text-white drop-shadow-sm select-none leading-none',
                  isZenMode
                    ? 'text-[23vw] sm:text-[19vw] lg:text-[12rem]'
                    : 'text-7xl sm:text-8xl'
                )}
              >
                {mins}:{secs}
              </div>
            </div>

            {/* Κουμπιά Ελέγχου: Normal Mode (inline) vs Zen Mode (fixed κάτω ώστε να μην σπρώχνουν το ρολόι) */}
            <div
              className={cx(
                'flex items-center justify-center gap-3 transition-opacity duration-500',
                isZenMode
                  ? cx(
                      'fixed bottom-7 left-1/2 -translate-x-1/2 z-30',
                      showZenControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    )
                  : 'mt-6 sm:mt-8 opacity-100'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3 text-sm font-semibold text-stone-900 shadow-lg transition hover:bg-amber-50 active:scale-95"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4" /> Παύση
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> {secondsLeft === totalSeconds ? 'Έναρξη' : 'Συνέχεια'}
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsRunning(false);
                  setSecondsLeft(totalSeconds);
                }}
                className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
                title="Επαναφορά"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              {isZenMode && !isMobileLandscape && (
                <button
                  onClick={exitZenMode}
                  className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 px-4 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  <Minimize2 className="h-4 w-4" /> Έξοδος
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Επιλογή Στόχου */}
        {!isZenMode && (
          <div className="rounded-3xl border border-stone-200/70 bg-white/80 p-4 sm:p-5 shadow-sm backdrop-blur-sm">
            <h3 className="mb-3.5 flex items-center gap-2 text-sm font-semibold text-stone-800">
              <Target className="h-4 w-4 text-amber-600 shrink-0" /> Στόχος Session
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-stone-400">
                  Από τα σημερινά Tasks
                </label>
                <select
                  className="input w-full py-2.5 text-sm sm:py-2"
                  value={selectedTaskId}
                  onChange={(e) => {
                    setSelectedTaskId(e.target.value);
                    if (e.target.value) setCustomGoal('');
                  }}
                >
                  <option value="">-- Επίλεξε task --</option>
                  {todaysTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-stone-400">
                  Ή γράψε γρήγορο στόχο
                </label>
                <input
                  className="input w-full py-2.5 text-sm sm:py-2"
                  placeholder="π.χ. Στήσιμο landing page..."
                  value={customGoal}
                  onChange={(e) => {
                    setCustomGoal(e.target.value);
                    if (e.target.value) setSelectedTaskId('');
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- ΔΕΞΙΑ ΣΤΗΛΗ: STATS, SPOTIFY & BRAIN DUMP --- */}
      <div className={cx(isZenMode ? '' : 'space-y-5 sm:space-y-6')}>
        {!isZenMode && (
          <div className="rounded-3xl bg-stone-900 p-5 text-white shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                Σημερινό Focus
              </span>
              <Flame className="h-4 w-4 text-amber-400" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-timer text-3xl font-light">{stats.sessions}</p>
                <p className="mt-0.5 text-xs text-stone-400">Sessions</p>
              </div>
              <div>
                <p className="font-timer text-3xl font-light">{stats.minutes}'</p>
                <p className="mt-0.5 text-xs text-stone-400">Καθαρός Χρόνος</p>
              </div>
            </div>
          </div>
        )}

        {/* Κουμπί Spotify στο Zen Mode */}
        {isZenMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZenSpotifyOpen((v) => !v);
            }}
            className={cx(
              'fixed bottom-7 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all duration-300 hover:bg-black/60',
              showZenControls || zenSpotifyOpen ? 'opacity-100' : 'opacity-25 hover:opacity-100'
            )}
            title="Έλεγχος Spotify"
          >
            {zenSpotifyOpen ? <X className="h-4 w-4" /> : <Music className="h-4 w-4" />}
          </button>
        )}

        {/* SPOTIFY CONTAINER */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={cx(
            'transition-all duration-300',
            isZenMode
              ? zenSpotifyOpen
                ? 'fixed bottom-20 right-5 z-40 w-[300px] sm:w-[340px] rounded-2xl border border-white/20 bg-stone-900/90 p-3 shadow-2xl backdrop-blur-xl'
                : 'pointer-events-none fixed -bottom-[500px] right-5 opacity-0'
              : 'rounded-3xl border border-stone-200/70 bg-white/80 p-4 sm:p-5 shadow-sm backdrop-blur-sm space-y-3'
          )}
        >
          {!isZenMode && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-stone-800">Spotify Focus</h3>
              </div>
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-medium text-stone-500">
                Παίζει παντού
              </span>
            </div>
          )}

          <iframe
            style={{ borderRadius: '12px' }}
            src={spotifyEmbedUrl}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify Player"
          />

          {!isZenMode && (
            <form onSubmit={handleSpotifySubmit} className="flex gap-2">
              <input
                className="input flex-1 py-2 text-xs"
                placeholder="Paste link από Spotify..."
                value={spotifyInput}
                onChange={(e) => setSpotifyInput(e.target.value)}
              />
              <Button
                type="submit"
                variant="soft"
                size="sm"
                disabled={!spotifyInput.trim()}
                className="px-3"
                title="Φόρτωση Playlist"
              >
                <Link2 className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>

        {/* Brain Dump */}
        {!isZenMode && (
          <div className="rounded-3xl border border-stone-200/70 bg-white/80 p-4 sm:p-5 shadow-sm backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-800">
                <StickyNote className="h-4 w-4 text-stone-400" /> Brain Dump
              </h3>
              {brainDump && (
                <button
                  onClick={() => setBrainDump('')}
                  className="px-2 py-1 text-xs font-medium text-stone-400 transition hover:text-rose-500"
                >
                  Καθαρισμός
                </button>
              )}
            </div>
            <textarea
              className="input min-h-[130px] w-full resize-y bg-stone-50/50 text-sm focus:bg-white"
              placeholder="Γράψε εδώ ό,τι σου αποσπά την προσοχή για να το δεις μετά..."
              value={brainDump}
              onChange={(e) => setBrainDump(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}