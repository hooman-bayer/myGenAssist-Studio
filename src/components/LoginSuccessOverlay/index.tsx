import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { BlurText } from '@/components/ui/BlurText';
import { BRAND_COLORS, prefersReducedMotion } from '@/lib/timeGreeting';

interface LoginSuccessOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
}

/**
 * Apple Face ID-style login success animation
 * Animation sequence (~1.2s total):
 * 1. Full-screen overlay fades in with brand gradient
 * 2. Animated checkmark draws with satisfying spring bounce
 * 3. "Welcome back" text reveals with blur-to-focus
 * 4. Overlay elegantly dissolves into main app
 */
export function LoginSuccessOverlay({
  isVisible,
  onComplete,
}: LoginSuccessOverlayProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'checkmark' | 'text' | 'exit'>('checkmark');
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    if (!isVisible) {
      setPhase('checkmark');
      return;
    }

    if (reducedMotion) {
      // Skip animations for reduced motion preference
      const timer = setTimeout(onComplete, 300);
      return () => clearTimeout(timer);
    }

    // Animation sequence timing
    const textTimer = setTimeout(() => setPhase('text'), 350);
    const exitTimer = setTimeout(() => setPhase('exit'), 900);
    const completeTimer = setTimeout(onComplete, 1200);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [isVisible, onComplete, reducedMotion]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${BRAND_COLORS.teal}15 0%, ${BRAND_COLORS.green}10 50%, ${BRAND_COLORS.blue}15 100%)`,
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Animated checkmark */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
              scale: phase === 'exit' ? 0.8 : 1,
              opacity: phase === 'exit' ? 0 : 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              duration: reducedMotion ? 0 : undefined,
            }}
            className="mb-6"
          >
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Circle background */}
              <motion.circle
                cx="40"
                cy="40"
                r="36"
                stroke={BRAND_COLORS.teal}
                strokeWidth="3"
                fill="transparent"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: reducedMotion ? 0 : 0.3,
                  ease: 'easeOut',
                }}
              />
              {/* Checkmark */}
              <motion.path
                d="M24 42L34 52L56 30"
                stroke={BRAND_COLORS.green}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: reducedMotion ? 0 : 0.25,
                  delay: reducedMotion ? 0 : 0.15,
                  ease: 'easeOut',
                }}
              />
            </svg>
          </motion.div>

          {/* Welcome back text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: phase === 'text' || phase === 'exit' ? 1 : 0,
              y: phase === 'text' || phase === 'exit' ? 0 : 10,
            }}
            transition={{
              duration: reducedMotion ? 0 : 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="text-xl font-semibold text-text-heading"
          >
            {reducedMotion ? (
              t('layout.welcome-back')
            ) : (
              <BlurText
                text={t('layout.welcome-back')}
                delay={60}
                animateBy="chars"
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LoginSuccessOverlay;
