import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BlurText } from '@/components/ui/BlurText';
import { GradientText } from '@/components/ui/GradientText';
import { useTimeBasedGreeting } from '@/hooks/useTimeBasedGreeting';

interface AnimatedWelcomeProps {
  className?: string;
  onAnimationComplete?: () => void;
}

/**
 * Animated welcome component with time-based greetings
 * Uses orchestrated animation sequence:
 * 1. Background gradient fade-in
 * 2. Time-based greeting reveals (BlurText, word-by-word)
 * 3. Rhyming tagline fades up with GradientText
 * 4. "How can I help you?" appears with blur effect
 */
export function AnimatedWelcome({
  className = '',
  onAnimationComplete,
}: AnimatedWelcomeProps) {
  const { t } = useTranslation();
  const { config, reducedMotion } = useTimeBasedGreeting();

  // Animation timing (in seconds)
  const timing = {
    greeting: reducedMotion ? 0 : 0.2,
    tagline: reducedMotion ? 0 : 0.6,
    helpText: reducedMotion ? 0 : 1.0,
  };

  // Transition config for reduced motion support
  const getTransition = (delay: number) => ({
    duration: reducedMotion ? 0 : 0.5,
    delay: reducedMotion ? 0 : delay,
    ease: [0.4, 0, 0.2, 1] as const,
  });

  return (
    <div data-testid="animated-welcome" className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Time-based greeting with blur reveal */}
      <AnimatePresence mode="wait">
        <motion.div
          key={config.period}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={getTransition(timing.greeting)}
          className="text-body-lg text-text-heading text-center font-bold"
        >
          <BlurText
            text={t(config.greetingKey)}
            delay={reducedMotion ? 0 : 80}
            animateBy="words"
          />
        </motion.div>
      </AnimatePresence>

      {/* Rhyming tagline with animated gradient */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={getTransition(timing.tagline)}
        className="text-body-md text-center"
      >
        <GradientText
          colors={config.gradientColors}
          animationSpeed={4}
          className="font-medium"
        >
          {t(config.taglineKey)}
        </GradientText>
      </motion.div>

      {/* How can I help you? */}
      <motion.div
        initial={{ opacity: 0, filter: reducedMotion ? 'blur(0px)' : 'blur(8px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={getTransition(timing.helpText)}
        onAnimationComplete={onAnimationComplete}
        className="text-body-lg leading-7 text-text-label text-center mt-2"
      >
        {t('layout.how-can-i-help-you')}
      </motion.div>
    </div>
  );
}

export default AnimatedWelcome;
