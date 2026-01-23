import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

interface GradientTextProps {
  children: React.ReactNode;
  colors?: string[];
  animationSpeed?: number;
  className?: string;
}

export function GradientText({
  children,
  colors = ["#8AD32A", "#00BCFF", "#73FCFC", "#8AD32A"],
  animationSpeed = 3,
  className = "",
}: GradientTextProps) {
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);

  useAnimationFrame((_time, delta) => {
    elapsedRef.current += delta;
    const cycleTime = (elapsedRef.current / 1000) % (animationSpeed * 2);

    if (cycleTime < animationSpeed) {
      progress.set((cycleTime / animationSpeed) * 100);
    } else {
      progress.set(100 - ((cycleTime - animationSpeed) / animationSpeed) * 100);
    }
  });

  const backgroundPosition = useTransform(progress, (p) => `${p}% 50%`);

  return (
    <motion.span
      className={className}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})`,
        backgroundSize: "200% 100%",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundPosition,
      }}
    >
      {children}
    </motion.span>
  );
}
