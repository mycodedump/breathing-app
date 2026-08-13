import { useRef, useCallback, useEffect } from "react";

type Phase = "inhale" | "hold-in" | "exhale" | "hold-out";

export function useAmbientSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{
    masterGain: GainNode;
    padGains: GainNode[];
    padOscs: OscillatorNode[];
    windNode: AudioBufferSourceNode | null;
    windGain: GainNode;
    cueOsc: OscillatorNode;
    cueGain: GainNode;
    cueFilter: BiquadFilterNode;
  } | null>(null);
  const isPlayingRef = useRef(false);
  const driftIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createWindNoise = (ctx: AudioContext, gain: GainNode) => {
    // Create pink-ish noise for gentle wind texture
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.025;
      b6 = white * 0.115926;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Low pass filter for softness
    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.setValueAtTime(400, ctx.currentTime);
    lpf.Q.setValueAtTime(0.5, ctx.currentTime);

    source.connect(lpf);
    lpf.connect(gain);
    source.start();

    return source;
  };

  const start = useCallback(() => {
    if (isPlayingRef.current) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const t = ctx.currentTime;

    // Master gain - fade in very gently
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, t);
    masterGain.gain.linearRampToValueAtTime(1, t + 4);
    masterGain.connect(ctx.destination);

    // ── Warm pad layer ──
    // Using triangle waves for warmth, tuned to a calming C major 7 voicing
    const padFreqs = [65.41, 130.81, 164.81, 196.0, 246.94]; // C2, C3, E3, G3, B3
    const padVols = [0.025, 0.018, 0.012, 0.012, 0.008];
    const padOscs: OscillatorNode[] = [];
    const padGains: GainNode[] = [];

    padFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(padVols[i], t);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      padOscs.push(osc);
      padGains.push(gain);
    });

    // ── Wind / breath texture ──
    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.015, t);
    windGain.connect(masterGain);
    const windNode = createWindNoise(ctx, windGain);

    // ── Breathing cue tone ──
    // Sine through a gentle bandpass for a soft, flute-like quality
    const cueFilter = ctx.createBiquadFilter();
    cueFilter.type = "bandpass";
    cueFilter.frequency.setValueAtTime(500, t);
    cueFilter.Q.setValueAtTime(2, t);

    const cueGain = ctx.createGain();
    cueGain.gain.setValueAtTime(0, t);
    cueFilter.connect(cueGain);
    cueGain.connect(masterGain);

    const cueOsc = ctx.createOscillator();
    cueOsc.type = "sine";
    cueOsc.frequency.setValueAtTime(440, t);
    cueOsc.connect(cueFilter);
    cueOsc.start();

    // ── Gentle drift for organic feel ──
    const driftInterval = setInterval(() => {
      if (!audioCtxRef.current) {
        clearInterval(driftInterval);
        return;
      }
      const now = audioCtxRef.current.currentTime;
      // Very subtle pitch drift on the pad
      padOscs.forEach((osc, i) => {
        const base = padFreqs[i];
        const drift = Math.sin(now * 0.03 * (i + 1)) * 0.5;
        osc.frequency.linearRampToValueAtTime(base + drift, now + 3);
      });
      // Gentle wind volume modulation
      const windVol = 0.012 + Math.sin(now * 0.05) * 0.005;
      windGain.gain.linearRampToValueAtTime(windVol, now + 3);
    }, 4000);

    driftIntervalRef.current = driftInterval;
    nodesRef.current = {
      masterGain,
      padGains,
      padOscs,
      windNode,
      windGain,
      cueOsc,
      cueGain,
      cueFilter,
    };
    isPlayingRef.current = true;
  }, []);

  // Tonal cue: a gentle, flute-like pitch shift to indicate inhale/exhale
  const playCue = useCallback((phase: Phase, duration: number) => {
    if (!audioCtxRef.current || !nodesRef.current) return;

    const ctx = audioCtxRef.current;
    const { cueOsc, cueGain, cueFilter } = nodesRef.current;
    const t = ctx.currentTime;

    // Cancel any scheduled values
    cueGain.gain.cancelScheduledValues(t);
    cueOsc.frequency.cancelScheduledValues(t);
    cueFilter.frequency.cancelScheduledValues(t);

    if (phase === "inhale") {
      // Gentle ascending tone — like a soft chime rising
      cueGain.gain.setValueAtTime(0, t);
      cueGain.gain.linearRampToValueAtTime(0.035, t + 0.6);
      cueGain.gain.setValueAtTime(0.035, t + duration * 0.3);
      cueGain.gain.linearRampToValueAtTime(0.015, t + duration * 0.6);
      cueGain.gain.linearRampToValueAtTime(0, t + duration * 0.9);

      // C5 → E5 (gentle major third rise)
      cueOsc.frequency.setValueAtTime(523.25, t);
      cueOsc.frequency.linearRampToValueAtTime(659.25, t + duration * 0.7);

      cueFilter.frequency.setValueAtTime(600, t);
      cueFilter.frequency.linearRampToValueAtTime(900, t + duration * 0.5);
    } else if (phase === "exhale") {
      // Gentle descending tone — like a sigh
      cueGain.gain.setValueAtTime(0, t);
      cueGain.gain.linearRampToValueAtTime(0.03, t + 0.5);
      cueGain.gain.setValueAtTime(0.03, t + duration * 0.25);
      cueGain.gain.linearRampToValueAtTime(0.01, t + duration * 0.6);
      cueGain.gain.linearRampToValueAtTime(0, t + duration * 0.9);

      // E5 → C5 (descending)
      cueOsc.frequency.setValueAtTime(659.25, t);
      cueOsc.frequency.linearRampToValueAtTime(392.0, t + duration * 0.75); // down to G4

      cueFilter.frequency.setValueAtTime(800, t);
      cueFilter.frequency.linearRampToValueAtTime(400, t + duration * 0.6);
    } else if (phase === "hold-in") {
      // Very soft sustained note
      cueGain.gain.setValueAtTime(0, t);
      cueGain.gain.linearRampToValueAtTime(0.01, t + 0.8);
      cueGain.gain.linearRampToValueAtTime(0, t + Math.min(duration * 0.5, 3));

      cueOsc.frequency.setValueAtTime(523.25, t); // C5
      cueFilter.frequency.setValueAtTime(500, t);
    } else if (phase === "hold-out") {
      // Near silence — just a whisper
      cueGain.gain.setValueAtTime(0, t);
      cueGain.gain.linearRampToValueAtTime(0.005, t + 0.5);
      cueGain.gain.linearRampToValueAtTime(0, t + Math.min(duration * 0.4, 1.5));

      cueOsc.frequency.setValueAtTime(392.0, t); // G4
      cueFilter.frequency.setValueAtTime(400, t);
    }
  }, []);

  const stop = useCallback(() => {
    if (!isPlayingRef.current || !audioCtxRef.current || !nodesRef.current) return;

    const ctx = audioCtxRef.current;
    const { masterGain, cueGain } = nodesRef.current;

    // Graceful fade out
    const t = ctx.currentTime;
    masterGain.gain.linearRampToValueAtTime(0, t + 3);
    cueGain.gain.cancelScheduledValues(t);
    cueGain.gain.linearRampToValueAtTime(0, t + 0.5);

    if (driftIntervalRef.current) {
      clearInterval(driftIntervalRef.current);
      driftIntervalRef.current = null;
    }

    setTimeout(() => {
      try {
        nodesRef.current?.padOscs.forEach((o) => o.stop());
        nodesRef.current?.cueOsc.stop();
        nodesRef.current?.windNode?.stop();
        ctx.close();
      } catch {}
      nodesRef.current = null;
      audioCtxRef.current = null;
      isPlayingRef.current = false;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (driftIntervalRef.current) clearInterval(driftIntervalRef.current);
      if (isPlayingRef.current) {
        try {
          nodesRef.current?.padOscs.forEach((o) => o.stop());
          nodesRef.current?.cueOsc.stop();
          nodesRef.current?.windNode?.stop();
          audioCtxRef.current?.close();
        } catch {}
      }
    };
  }, []);

  return { start, stop, playCue };
}
