import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MountainBackground } from "./MountainBackground";
import { SunCharacter } from "./SunCharacter";
import { useAmbientSound } from "./useAmbientSound";
import { Play, Pause, X, Volume2, VolumeX, Clock, Wind } from "lucide-react";

type Phase = "idle" | "inhale" | "hold-in" | "exhale" | "hold-out";
type Screen = "home" | "countdown" | "session" | "complete";

interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  durations: Record<Exclude<Phase, "idle">, number>;
}

const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: "relaxing",
    name: "Calm",
    description: "4-4-6-2",
    durations: { inhale: 4, "hold-in": 4, exhale: 6, "hold-out": 2 },
  },
  {
    id: "box",
    name: "Box",
    description: "4-4-4-4",
    durations: { inhale: 4, "hold-in": 4, exhale: 4, "hold-out": 4 },
  },
  {
    id: "478",
    name: "4-7-8",
    description: "4-7-8-0",
    durations: { inhale: 4, "hold-in": 7, exhale: 8, "hold-out": 0 },
  },
  {
    id: "simple",
    name: "Simple",
    description: "4-0-4-0",
    durations: { inhale: 4, "hold-in": 0, exhale: 4, "hold-out": 0 },
  },
];

const PHASE_LABELS: Record<Phase, string> = {
  idle: "Ready",
  inhale: "Breathe in",
  "hold-in": "Hold",
  exhale: "Breathe out",
  "hold-out": "Rest",
};

const PHASE_ORDER: Exclude<Phase, "idle">[] = ["inhale", "hold-in", "exhale", "hold-out"];

const TIMER_OPTIONS = [1, 3, 5, 10];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const HAPTIC_PATTERNS: Record<"inhale" | "exhale" | "hold" | "tap", number[]> = {
  inhale: [40, 100, 40],
  exhale: [90],
  hold: [25],
  tap: [15],
};

interface HapticDebugInfo {
  pattern: string;
  supported: boolean;
  secureContext: boolean;
  sticky?: boolean;
  transient?: boolean;
  result: boolean | "unsupported" | "muted";
}

let hapticDebugListener: ((info: HapticDebugInfo) => void) | null = null;
let hapticsEnabledGlobal = true;

/**
 * Trigger haptic feedback using the Vibration API (Android only - iOS Safari
 * has no Vibration API). The browser only controls vibration *duration*, not
 * amplitude/intensity - how strong it feels is up to the device's own OS
 * settings (e.g. Android's touch vibration intensity), so identical calls
 * can feel very different across phones.
 */
function haptic(pattern: "inhale" | "exhale" | "hold" | "tap") {
  const supported = typeof navigator.vibrate === "function";
  const result = !hapticsEnabledGlobal ? "muted" : supported ? navigator.vibrate(HAPTIC_PATTERNS[pattern]) : "unsupported";
  if (hapticDebugListener) {
    const activation = (navigator as unknown as { userActivation?: { hasBeenActive: boolean; isActive: boolean } })
      .userActivation;
    hapticDebugListener({
      pattern,
      supported,
      secureContext: window.isSecureContext,
      sticky: activation?.hasBeenActive,
      transient: activation?.isActive,
      result,
    });
  }
}

export function BreathingApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [phase, setPhase] = useState<Phase>("idle");
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [cycleCount, setCycleCount] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState(BREATHING_PATTERNS[0]);
  const [countdown, setCountdown] = useState(3);
  const [sunRise, setSunRise] = useState(0);
  const [hapticDebug, setHapticDebug] = useState<HapticDebugInfo | null>(null);
  const phaseIndexRef = useRef(0);
  const { start: startSound, stop: stopSound, playCue } = useAmbientSound();

  const debugMode = new URLSearchParams(window.location.search).get("debug") === "1";

  useEffect(() => {
    hapticsEnabledGlobal = hapticsEnabled;
  }, [hapticsEnabled]);

  // Surface haptic call results on-screen when ?debug=1 is in the URL, so
  // vibration issues can be diagnosed on a phone without remote devtools.
  useEffect(() => {
    if (!debugMode) return;
    hapticDebugListener = setHapticDebug;
    return () => {
      hapticDebugListener = null;
    };
  }, [debugMode]);

  // Start countdown
  const startSession = useCallback(() => {
    setScreen("countdown");
    setCountdown(3);
    setSunRise(0);
    setCycleCount(0);
    phaseIndexRef.current = 0;
    setPhase("idle");
    if (soundEnabled) startSound();
  }, [soundEnabled, startSound]);

  // Countdown timer + sun descends from top
  useEffect(() => {
    if (screen !== "countdown") return;

    const riseStep = 1 / 3;
    setSunRise(riseStep * (3 - countdown + 1));

    if (countdown <= 0) {
      setSunRise(1);
      setScreen("session");
      setSessionTimeLeft(sessionDuration * 60);
      const activePhases = PHASE_ORDER.filter((p) => selectedPattern.durations[p] > 0);
      const firstPhase = activePhases[0];
      phaseIndexRef.current = 0;
      setPhase(firstPhase);
      setPhaseTimeLeft(selectedPattern.durations[firstPhase]);
      setIsPaused(false);
      haptic("inhale");
      if (soundEnabled) playCue(firstPhase, selectedPattern.durations[firstPhase]);
      return;
    }

    haptic("tap");

    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [screen, countdown, sessionDuration, selectedPattern, soundEnabled, playCue]);

  const endSession = useCallback(() => {
    setPhase("idle");
    stopSound();
    setSunRise(0);
    setScreen("home");
    setIsPaused(false);
  }, [stopSound]);

  const completeSession = useCallback(() => {
    setPhase("idle");
    stopSound();
    setScreen("complete");
    haptic("tap");
  }, [stopSound]);

  // Phase timer
  useEffect(() => {
    if (screen !== "session" || isPaused || phase === "idle") return;

    const interval = setInterval(() => {
      setPhaseTimeLeft((prev) => {
        if (prev <= 1) {
          const activePhases = PHASE_ORDER.filter((p) => selectedPattern.durations[p] > 0);
          const currentActiveIndex = activePhases.indexOf(phase as Exclude<Phase, "idle">);
          const nextActiveIndex = (currentActiveIndex + 1) % activePhases.length;
          const nextPhase = activePhases[nextActiveIndex];
          phaseIndexRef.current = nextActiveIndex;
          setPhase(nextPhase);

          if (nextActiveIndex === 0) setCycleCount((c) => c + 1);

          // Haptic on phase transition
          if (nextPhase === "inhale") haptic("inhale");
          else if (nextPhase === "exhale") haptic("exhale");
          else haptic("hold");

          if (soundEnabled) playCue(nextPhase, selectedPattern.durations[nextPhase]);

          return selectedPattern.durations[nextPhase];
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [screen, isPaused, phase, selectedPattern, soundEnabled, playCue]);

  // Session timer
  useEffect(() => {
    if (screen !== "session" || isPaused) return;

    const interval = setInterval(() => {
      setSessionTimeLeft((prev) => {
        if (prev <= 1) {
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [screen, isPaused, completeSession]);

  // Sound toggle
  useEffect(() => {
    if (screen === "session" && !isPaused) {
      if (soundEnabled) startSound();
      else stopSound();
    }
  }, [soundEnabled]);

  const togglePause = () => {
    haptic("tap");
    if (isPaused) {
      setIsPaused(false);
      if (soundEnabled) startSound();
    } else {
      setIsPaused(true);
      stopSound();
    }
  };

  const sunPhase =
    screen === "home"
      ? "hidden"
      : screen === "countdown"
        ? "countdown"
        : isPaused
          ? "idle"
          : phase;

  return (
    <div
      className="relative w-full h-full max-w-[430px] mx-auto bg-[#c1d4d2] overflow-hidden select-none @container md:h-[65vh] md:rounded-[24px]"
    >
      {/* Sun - sits behind the mountains (z 1, positioned at top) */}
      <SunCharacter phase={sunPhase} riseProgress={sunRise} />

      {/* Mountains (z 2-5) - rendered above the sun */}
      <MountainBackground />

      {/* UI overlay (z 10) */}
      <AnimatePresence mode="wait">
        {/* ─── HOME ─── */}
        {screen === "home" && (
          <motion.div
            key="home"
            className="absolute inset-0 flex flex-col items-center justify-between pb-12 pt-16 px-6"
            style={{ zIndex: 10 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Title */}
            <motion.div
              className="flex flex-col items-center gap-2 mt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h1
                className="text-[#3b4a30] tracking-wide drop-shadow-[0_1px_2px_rgba(255,255,255,0.3)]"
                style={{ fontSize: "clamp(26px, 7cqw, 32px)", fontWeight: 500 }}
              >
                Breathe
              </h1>
              <p
                className="text-[#4a5a3e] text-center drop-shadow-[0_1px_1px_rgba(255,255,255,0.2)]"
                style={{ fontSize: 14, lineHeight: 1.6, fontWeight: 400 }}
              >
                Take a moment to find your calm
              </p>
            </motion.div>

            {/* Pattern + session length - centered in the remaining space */}
            <motion.div
              className="flex flex-col items-center gap-5 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {/* Pattern selector */}
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-2 text-[#3b4a30]">
                  <Wind size={14} />
                  <span style={{ fontSize: 13, fontWeight: 400 }}>Breathing pattern</span>
                </div>
                <div className="flex gap-2 w-full justify-center">
                  {BREATHING_PATTERNS.map((pattern) => (
                    <motion.button
                      key={pattern.id}
                      className={`flex flex-col items-center gap-1 px-3.5 py-3 rounded-2xl backdrop-blur-sm transition-colors duration-300 ${
                        selectedPattern.id === pattern.id
                          ? "bg-[#3b4a30]/85 text-[#d8d8b9]"
                          : "bg-[#d8d8b9]/60 text-[#3b4a30]"
                      }`}
                      onClick={() => {
                        setSelectedPattern(pattern);
                        haptic("tap");
                      }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{pattern.name}</span>
                      <span
                        style={{ fontSize: 10, fontWeight: 400 }}
                        className={
                          selectedPattern.id === pattern.id ? "text-[#d8d8b9]/70" : "text-[#3b4a30]/50"
                        }
                      >
                        {pattern.description}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Timer */}
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-2 text-[#3b4a30]">
                  <Clock size={14} />
                  <span style={{ fontSize: 13, fontWeight: 400 }}>Session length</span>
                </div>
                <div className="flex gap-3">
                  {TIMER_OPTIONS.map((mins) => (
                    <motion.button
                      key={mins}
                      className={`w-13 h-13 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors duration-300 ${
                        sessionDuration === mins
                          ? "bg-[#3b4a30]/85 text-[#d8d8b9]"
                          : "bg-[#d8d8b9]/60 text-[#3b4a30]"
                      }`}
                      style={{ fontSize: 14, fontWeight: 500 }}
                      onClick={() => {
                        setSessionDuration(mins);
                        haptic("tap");
                      }}
                      whileTap={{ scale: 0.92 }}
                      transition={{ duration: 0.15 }}
                    >
                      {mins}m
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Begin - stays anchored at the bottom */}
            <motion.button
              className="w-full max-w-[240px] py-4 rounded-full bg-[#3b4a30]/85 text-[#d8d8b9] tracking-wider backdrop-blur-sm"
              style={{ fontSize: 16, fontWeight: 500 }}
              onClick={startSession}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              Begin
            </motion.button>

            {/* Credit footer */}
            <div className="absolute bottom-2 inset-x-0 flex justify-center">
              <p className="text-[#3b4a30]/50" style={{ fontSize: 11, fontWeight: 400 }}>
                Designed by{" "}
                <a
                  href="https://mycodedump.github.io/portfolio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#3b4a30]/70"
                >
                  Laxmi Mahajan
                </a>
              </p>
            </div>
          </motion.div>
        )}

        {/* ─── COUNTDOWN ─── */}
        {screen === "countdown" && (
          <motion.div
            key="countdown"
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ zIndex: 10 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={countdown}
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {countdown > 0 ? (
                  <span
                    className="text-[#3b4a30] drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]"
                    style={{ fontSize: "clamp(56px, 20cqw, 80px)", fontWeight: 300, lineHeight: 1 }}
                  >
                    {countdown}
                  </span>
                ) : (
                  <span
                    className="text-[#3b4a30] tracking-widest drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]"
                    style={{ fontSize: 24, fontWeight: 500 }}
                  >
                    Begin
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
            <motion.p
              className="absolute bottom-28 text-[#3b4a30]/50"
              style={{ fontSize: 13, fontWeight: 400 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {selectedPattern.name} breathing · {selectedPattern.description}
            </motion.p>
          </motion.div>
        )}

        {/* ─── SESSION ─── */}
        {screen === "session" && (
          <motion.div
            key="session"
            className="absolute inset-0 flex flex-col items-center justify-between pb-12 px-4"
            style={{ zIndex: 10, paddingTop: 16 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between w-full">
              <motion.button
                className="w-10 h-10 rounded-full bg-[#d8d8b9]/40 backdrop-blur-sm flex items-center justify-center text-[#3b4a30]"
                onClick={endSession}
                whileTap={{ scale: 0.9 }}
              >
                <X size={18} />
              </motion.button>

              <motion.div
                className="px-3 py-1 rounded-full bg-[#d8d8b9]/30 backdrop-blur-sm text-[#3b4a30]"
                style={{ fontSize: 14, fontWeight: 500 }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                {formatTime(sessionTimeLeft)}
              </motion.div>

              <motion.button
                className="w-10 h-10 rounded-full bg-[#d8d8b9]/40 backdrop-blur-sm flex items-center justify-center text-[#3b4a30]"
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  setHapticsEnabled(next);
                }}
                whileTap={{ scale: 0.9 }}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </motion.button>
            </div>

            {/* Bottom controls: phase pill, pause button, cycle count */}
            <div className="flex flex-col items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isPaused ? "paused" : phase}
                  className="flex flex-col items-center gap-3"
                  style={{ marginBottom: 20 }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="px-5 py-2 rounded-full bg-[#d8d8b9]/45 backdrop-blur-md">
                    <span
                      className="text-[#3b4a30]"
                      style={{ fontSize: "clamp(13px, 4cqw, 15px)", fontWeight: 400, letterSpacing: "0px" }}
                    >
                      {isPaused ? "Paused" : PHASE_LABELS[phase]}
                    </span>
                  </div>
                  {!isPaused &&
                    phase !== "idle" &&
                    selectedPattern.durations[phase as Exclude<Phase, "idle">] > 0 && (
                      <motion.div className="flex gap-1.5">
                        {Array.from({
                          length: selectedPattern.durations[phase as Exclude<Phase, "idle">],
                        }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full"
                            animate={{
                              backgroundColor:
                                i <
                                selectedPattern.durations[phase as Exclude<Phase, "idle">] -
                                  phaseTimeLeft +
                                  1
                                  ? "#e1cb79"
                                  : "rgba(225, 203, 121, 0.2)",
                              scale:
                                i ===
                                selectedPattern.durations[phase as Exclude<Phase, "idle">] -
                                  phaseTimeLeft
                                  ? 1.3
                                  : 1,
                            }}
                            transition={{ duration: 0.3 }}
                          />
                        ))}
                      </motion.div>
                    )}
                </motion.div>
              </AnimatePresence>

              <div className="flex flex-col items-center gap-3">
                <motion.button
                  className="w-14 h-14 rounded-full bg-[#d8d8b9]/40 backdrop-blur-sm flex items-center justify-center text-[#3b4a30]"
                  onClick={togglePause}
                  whileTap={{ scale: 0.9 }}
                >
                  {isPaused ? <Play size={20} /> : <Pause size={20} />}
                </motion.button>
                <span
                  className="text-[#3b4a30]/50"
                  style={{ fontSize: 12, fontWeight: 400 }}
                >
                  {cycleCount} {cycleCount === 1 ? "cycle" : "cycles"}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── COMPLETE ─── */}
        {screen === "complete" && (
          <motion.div
            key="complete"
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8"
            style={{ zIndex: 10 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="flex flex-col items-center gap-3 px-6 py-6 rounded-3xl bg-[#d8d8b9]/40 backdrop-blur-md"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <h2
                className="text-[#3b4a30] tracking-wide"
                style={{ fontSize: "clamp(20px, 6.5cqw, 26px)", fontWeight: 500 }}
              >
                Well done
              </h2>
              <p
                className="text-[#4a5a3e] text-center"
                style={{ fontSize: 14, lineHeight: 1.7, fontWeight: 400 }}
              >
                You completed {cycleCount} breathing{" "}
                {cycleCount === 1 ? "cycle" : "cycles"}.
                <br />
                Carry this calm with you.
              </p>
            </motion.div>
            <motion.button
              className="mt-2 w-full max-w-[200px] py-3.5 rounded-full bg-[#3b4a30]/85 text-[#d8d8b9] tracking-wider"
              style={{ fontSize: 15, fontWeight: 500 }}
              onClick={() => {
                setSunRise(0);
                setScreen("home");
              }}
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              Finish
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {debugMode && (
        <div
          className="absolute bottom-2 left-2 right-2 rounded-lg bg-black/80 text-white px-3 py-2"
          style={{ zIndex: 50, fontSize: 11, fontFamily: "monospace", lineHeight: 1.5 }}
        >
          {hapticDebug
            ? `last: ${hapticDebug.pattern} → result=${hapticDebug.result} · supported=${hapticDebug.supported} · secureContext=${hapticDebug.secureContext} · sticky=${hapticDebug.sticky} · transient=${hapticDebug.transient}`
            : "no haptic call yet - tap Begin"}
        </div>
      )}
    </div>
  );
}
