import { motion, AnimatePresence, Variants } from "framer-motion";
import { useState, useEffect } from "react";
import myGenAssistLogo from "@/assets/mygenassist_logo.svg";

interface SplashScreenProps {
  onComplete?: () => void;
  slogan?: string;
}

export function SplashScreen({
  onComplete,
  slogan = "Your AI-powered workspace",
}: SplashScreenProps) {
  const [phase, setPhase] = useState<"logo" | "text" | "slogan" | "exit">(
    "logo"
  );
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("text"), 800),
      setTimeout(() => setPhase("slogan"), 2500),
      setTimeout(() => setPhase("exit"), 3500),
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onComplete?.(), 400);
      }, 4000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Staggered letter animation variants
  const letterVariants: Variants = {
    hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.05,
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    }),
  };

  const brandName = "myGenAssist";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] bg-white dark:bg-gray-950 flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Animated Gradient Background */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse at 20% 30%, rgba(138, 211, 42, 0.15) 0%, transparent 50%),
                  radial-gradient(ellipse at 80% 70%, rgba(0, 188, 255, 0.15) 0%, transparent 50%),
                  radial-gradient(ellipse at 50% 50%, rgba(115, 252, 252, 0.1) 0%, transparent 60%)
                `,
              }}
            />
          </motion.div>

          {/* Logo */}
          <motion.img
            src={myGenAssistLogo}
            alt="myGenAssist"
            className="w-20 h-20 mb-6"
            initial={{ opacity: 0, scale: 1.3, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
              ease: [0.4, 0, 0.2, 1],
            }}
          />

          {/* Brand Name with Gradient and Staggered Letters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase !== "logo" ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="flex items-baseline justify-center overflow-hidden">
              {brandName.split("").map((letter, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={letterVariants}
                  initial="hidden"
                  animate={phase !== "logo" ? "visible" : "hidden"}
                  className="text-4xl font-bold"
                  style={{
                    background:
                      "linear-gradient(90deg, #8AD32A, #00BCFF, #73FCFC, #1BC1D5)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* Subtitle "Studio" */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: phase !== "logo" ? 1 : 0,
                y: phase !== "logo" ? 0 : 10,
              }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-2xl font-medium text-gray-600 dark:text-gray-400 mt-1"
            >
              Studio
            </motion.div>
          </motion.div>

          {/* Slogan */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: phase === "slogan" || phase === "exit" ? 1 : 0,
              y: phase === "slogan" || phase === "exit" ? 0 : 20,
            }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="absolute bottom-[20%] text-lg text-gray-500 dark:text-gray-400 tracking-wide"
          >
            {slogan}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SplashScreen;
