import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  animateBy?: "words" | "chars";
  onAnimationComplete?: () => void;
}

export function BlurText({
  text,
  delay = 100,
  className = "",
  animateBy = "words",
  onAnimationComplete,
}: BlurTextProps) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const elements = animateBy === "words" ? text.split(" ") : text.split("");

  return (
    <p ref={ref} className={`flex flex-wrap justify-center ${className}`}>
      {elements.map((element, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
          animate={
            isInView
              ? {
                  opacity: 1,
                  filter: "blur(0px)",
                  y: 0,
                }
              : {}
          }
          transition={{
            delay: i * (delay / 1000),
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
          }}
          onAnimationComplete={
            i === elements.length - 1 ? onAnimationComplete : undefined
          }
          className="inline-block"
        >
          {element}
          {animateBy === "words" && <span>&nbsp;</span>}
        </motion.span>
      ))}
    </p>
  );
}
