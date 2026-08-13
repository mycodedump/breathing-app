import { motion } from "motion/react";
import svgPaths from "../../imports/svg-5005la55fq";

type Phase = "idle" | "inhale" | "hold-in" | "exhale" | "hold-out" | "countdown" | "hidden";

interface SunCharacterProps {
  phase: Phase;
  /** 0 = off-screen above, 1 = fully descended to position */
  riseProgress: number;
}

export function SunCharacter({ phase, riseProgress }: SunCharacterProps) {
  const showFace = phase !== "idle" && phase !== "countdown" && phase !== "hidden";
  const isExhaling = phase === "exhale" || phase === "hold-out";
  const isInhaling = phase === "inhale" || phase === "hold-in";

  // Sun scale: big for inhale, small for exhale — breathing effect
  const sunSize = (() => {
    if (phase === "hidden") return 0.3;
    if (phase === "countdown") return 0.55 + riseProgress * 0.25;
    if (isInhaling) return 1.4;
    if (isExhaling) return 0.7;
    return 0.6;
  })();

  // Y position: negative = above screen, 0 = target position at top area
  // Sun descends from above (-250) to its resting place (0)
  const yPosition = phase === "hidden" ? -250 : -250 + riseProgress * 250;

  return (
    <motion.div
      className="absolute flex items-center justify-center"
      style={{ top: "15%", left: "50%", translateX: "-50%", zIndex: 6 }}
      animate={{
        scale: sunSize,
        y: yPosition,
        opacity: phase === "hidden" ? 0 : 1,
      }}
      transition={{
        scale: {
          duration: phase === "inhale" ? 4 : phase === "exhale" ? 6 : phase === "countdown" ? 1 : 2,
          ease: "easeInOut",
        },
        y: {
          duration: phase === "countdown" ? 1.2 : 2,
          ease: [0.25, 0.1, 0.25, 1],
        },
        opacity: {
          duration: 0.6,
        },
      }}
    >
      {/* Soft radial glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 260,
          height: 260,
          background:
            "radial-gradient(circle, rgba(225,203,121,0.3) 0%, rgba(216,216,185,0.12) 50%, transparent 100%)",
        }}
        animate={{
          scale: isInhaling ? 1.4 : isExhaling ? 0.8 : 1,
          opacity: showFace ? 0.9 : 0.4,
        }}
        transition={{
          duration: phase === "inhale" ? 4 : phase === "exhale" ? 6 : 2,
          ease: "easeInOut",
        }}
      />

      {/* Outer body */}
      <div
        className="rounded-full bg-[#d8d8b9]"
        style={{ width: 160, height: 160 }}
      />

      {/* Inner sun */}
      <div
        className="absolute rounded-full bg-[#e1cb79]"
        style={{ width: 110, height: 110 }}
      />

      {/* Face - eyes and mouth */}
      <motion.div
        className="absolute flex flex-col items-center gap-[10px]"
        animate={{ opacity: showFace ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {/* Eyes */}
        <div className="flex gap-[6px] items-center">
          <div className="relative shrink-0" style={{ width: 21, height: 11 }}>
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 29 15.5">
              <path d={svgPaths.p12c87b80} fill="#CA7A0A" />
            </svg>
          </div>
          <div className="relative shrink-0" style={{ width: 21, height: 11 }}>
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 29 15.5">
              <path d={svgPaths.p12c87b80} fill="#CA7A0A" />
            </svg>
          </div>
        </div>
        {/* Mouth */}
        <motion.div
          className="relative shrink-0"
          style={{ width: 36, height: 6 }}
          animate={{
            scaleY: isExhaling ? 2 : 1,
            scaleX: isExhaling ? 0.75 : 1,
          }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        >
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 51.0008 7.93807">
            <path d={svgPaths.p2b283d00} fill="#CA7A0A" />
          </svg>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
