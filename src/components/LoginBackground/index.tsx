import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import myGenAssistLogo from "@/assets/mygenassist_logo.svg";

const SLOGANS = [
  "Welcome to myGenAssist Studio",
  "Designed to empower",
  "Simply brilliant",
  "Where ideas come to life",
];

/**
 * LoginBackground - Animated Aurora-style background for the login page
 *
 * Features:
 * - Aurora gradient animation with brand colors
 * - Floating orbs with subtle movement
 * - Grid pattern overlay for tech feel
 * - Centered logo watermark with slow rotation
 */
export function LoginBackground() {
  // Brand colors
  const brandColors = {
    green: "#8AD32A",
    blue: "#00BCFF",
    cyan: "#73FCFC",
    teal: "#1BC1D5",
  };

  // Orb configurations for variety
  const orbs = [
    { size: 120, x: "15%", y: "20%", color: brandColors.green, delay: 0 },
    { size: 180, x: "70%", y: "15%", color: brandColors.blue, delay: 0.5 },
    { size: 150, x: "80%", y: "60%", color: brandColors.cyan, delay: 1 },
    { size: 200, x: "25%", y: "70%", color: brandColors.teal, delay: 1.5 },
    { size: 100, x: "50%", y: "45%", color: brandColors.green, delay: 2 },
  ];

  // Rotating slogans state
  const [sloganIndex, setSloganIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSloganIndex((prev) => (prev + 1) % SLOGANS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Aurora Gradient Base - Animated */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            `radial-gradient(ellipse at 0% 0%, rgba(138, 211, 42, 0.35) 0%, transparent 50%),
             radial-gradient(ellipse at 100% 100%, rgba(0, 188, 255, 0.35) 0%, transparent 50%),
             radial-gradient(ellipse at 50% 50%, rgba(115, 252, 252, 0.2) 0%, transparent 60%)`,
            `radial-gradient(ellipse at 100% 0%, rgba(115, 252, 252, 0.35) 0%, transparent 50%),
             radial-gradient(ellipse at 0% 100%, rgba(27, 193, 213, 0.35) 0%, transparent 50%),
             radial-gradient(ellipse at 50% 50%, rgba(0, 188, 255, 0.2) 0%, transparent 60%)`,
            `radial-gradient(ellipse at 50% 0%, rgba(138, 211, 42, 0.3) 0%, transparent 50%),
             radial-gradient(ellipse at 100% 50%, rgba(0, 188, 255, 0.35) 0%, transparent 50%),
             radial-gradient(ellipse at 0% 100%, rgba(27, 193, 213, 0.25) 0%, transparent 60%)`,
            `radial-gradient(ellipse at 0% 0%, rgba(138, 211, 42, 0.35) 0%, transparent 50%),
             radial-gradient(ellipse at 100% 100%, rgba(0, 188, 255, 0.35) 0%, transparent 50%),
             radial-gradient(ellipse at 50% 50%, rgba(115, 252, 252, 0.2) 0%, transparent 60%)`,
          ],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating Orbs */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color}40 0%, ${orb.color}10 50%, transparent 70%)`,
            left: orb.x,
            top: orb.y,
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            y: [0, -25, 0, 15, 0],
            x: [0, 15, 0, -10, 0],
            scale: [1, 1.08, 1, 0.95, 1],
            opacity: [0.6, 0.8, 0.6, 0.7, 0.6],
          }}
          transition={{
            duration: 8 + i * 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(${brandColors.blue} 1px, transparent 1px),
            linear-gradient(90deg, ${brandColors.blue} 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Subtle diagonal lines for depth */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 50px,
            ${brandColors.teal} 50px,
            ${brandColors.teal} 51px
          )`,
        }}
      />

      {/* Centered Logo Watermark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center">
          {/* Semi-transparent backdrop for better visibility */}
          <div className="relative flex items-center justify-center">
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 200,
                height: 200,
                background: `radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)`,
              }}
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.6, 0.8, 0.6],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.img
              src={myGenAssistLogo}
              alt=""
              className="w-44 h-44"
              style={{
                opacity: 0.45,
                filter: `drop-shadow(0 0 20px rgba(0, 188, 255, 0.4)) drop-shadow(0 0 40px rgba(115, 252, 252, 0.2))`,
              }}
              animate={{
                rotate: 360,
                scale: [1, 1.03, 1],
              }}
              transition={{
                rotate: {
                  duration: 25,
                  repeat: Infinity,
                  ease: "linear",
                },
                scale: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            />
          </div>

          {/* Rotating Slogans */}
          <AnimatePresence mode="wait">
            <motion.p
              key={sloganIndex}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 0.55, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.5 }}
              className="text-white text-xl font-semibold tracking-wide mt-6"
            >
              {SLOGANS[sloganIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Top gradient fade for smooth edge */}
      <div
        className="absolute top-0 left-0 right-0 h-20"
        style={{
          background: "linear-gradient(to bottom, rgba(248, 250, 252, 0.8), transparent)",
        }}
      />

      {/* Bottom gradient fade for smooth edge */}
      <div
        className="absolute bottom-0 left-0 right-0 h-20"
        style={{
          background: "linear-gradient(to top, rgba(248, 250, 252, 0.8), transparent)",
        }}
      />
    </div>
  );
}

export default LoginBackground;
