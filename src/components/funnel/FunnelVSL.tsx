import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Play } from "lucide-react";
import { useFunnelStore } from "@/stores/useFunnelStore";

// ── Placeholder video (replace with real VSL URL later) ──
// Short 10s test video for flow testing
const VIDEO_URL =
  "https://www.w3schools.com/html/mov_bbb.mp4";

const FunnelVSL = () => {
  const next = useFunnelStore((s) => s.next);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showUnmuteOverlay, setShowUnmuteOverlay] = useState(true);
  const [realProgress, setRealProgress] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Handle play/mute on first tap ──
  const handleTapToUnmute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isPlaying) {
      video.play().catch(() => {});
      setIsPlaying(true);
    }

    video.muted = false;
    setIsMuted(false);
    setShowUnmuteOverlay(false);
  }, [isPlaying]);

  // ── Toggle mute ──
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  // ── Autoplay muted on mount ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    const playPromise = video.play();
    if (playPromise) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Autoplay blocked — show play button
          setIsPlaying(false);
        });
    }
  }, []);

  // ── Fake progress bar logic ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      const progressRatio = video.currentTime / video.duration;
      setRealProgress(progressRatio);

      // Show CTA 15s before end
      const timeLeft = video.duration - video.currentTime;
      if (timeLeft <= 15 && !showCTA) {
        setShowCTA(true);
      }
    };

    const handleEnded = () => {
      setVideoEnded(true);
      setShowCTA(true);
      // Auto-advance after 3s if no click
      autoAdvanceRef.current = setTimeout(() => {
        next();
      }, 3000);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, [next, showCTA]);

  // ── CTA click ──
  const handleCTAClick = () => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    next();
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* ── Video ── */}
      <video
        ref={videoRef}
        src={VIDEO_URL}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        preload="auto"
      />

      {/* ── Dark gradient overlay at bottom for readability ── */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

      {/* ── Unmute overlay ── */}
      <AnimatePresence>
        {showUnmuteOverlay && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={handleTapToUnmute}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm cursor-pointer"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 rounded-2xl p-6 flex flex-col items-center gap-4 max-w-[80vw]"
            >
              <Volume2 className="w-12 h-12 text-white" />
              <div className="text-center">
                <span className="block text-white/80 text-xs font-bold uppercase tracking-[0.2em] mb-1">Seu vídeo já começou</span>
                <span className="block text-white text-xl font-black uppercase tracking-wide">Clique para Ativar o Som</span>
              </div>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Mute toggle (after dismissing overlay) ── */}
      {!showUnmuteOverlay && (
        <button
          onClick={toggleMute}
          className="absolute top-6 right-6 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-colors hover:bg-black/60"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white/80" />
          ) : (
            <Volume2 className="w-5 h-5 text-white/80" />
          )}
        </button>
      )}

      {/* ── Real linear progress bar ── */}
      <div className="absolute top-0 left-0 right-0 z-30 h-1.5">
        <div className="h-full bg-white/10">
          <motion.div
            className="h-full rounded-r-full"
            style={{
              width: `${realProgress * 100}%`,
              background: "linear-gradient(90deg, hsl(342 100% 57%), hsl(342 100% 67%))",
            }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
      </div>

      {/* ── CTA Button ── */}
      <AnimatePresence>
        {showCTA && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-8 left-4 right-4 z-30"
          >
            <button
              onClick={handleCTAClick}
              className="w-full py-4 px-6 rounded-2xl text-white font-bold text-base tracking-wide shadow-2xl transition-transform active:scale-[0.97]"
              style={{
                background:
                  "linear-gradient(135deg, hsl(342 100% 57%), hsl(342 100% 47%))",
                boxShadow:
                  "0 0 30px hsl(342 100% 57% / 0.4), 0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              {videoEnded ? "Acesse o Aplicativo →" : "Acesse o Aplicativo →"}
            </button>

            {/* Auto-advance indicator */}
            {videoEnded && (
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 3, ease: "linear" }}
                className="h-0.5 mt-2 rounded-full mx-auto"
                style={{
                  background: "hsl(342 100% 57% / 0.6)",
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FunnelVSL;
