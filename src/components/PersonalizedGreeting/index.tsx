import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BlurText } from '@/components/ui/BlurText';
import { useTimeBasedGreeting } from '@/hooks/useTimeBasedGreeting';

interface PersonalizedGreetingProps {
  name: string;
  className?: string;
}

/**
 * Compact personalized greeting with subtle animated gradient
 * Inspired by LoginBackground but minimal for performance
 */
export function PersonalizedGreeting({
  name,
  className = '',
}: PersonalizedGreetingProps) {
  const { t } = useTranslation();
  const { config, reducedMotion } = useTimeBasedGreeting();

  // Extract first name for a more personal touch
  const firstName = name.split(' ')[0] || name;
  const colors = config.gradientColors;

  return (
    <div className={`relative ${className}`}>
      {/* Subtle gradient backdrop - very light, not distracting */}
      <motion.div
        className="absolute -inset-x-6 -inset-y-3 rounded-2xl -z-10"
        style={{
          background: `radial-gradient(ellipse 100% 100% at 0% 50%, ${colors[0]}12 0%, transparent 50%),
                       radial-gradient(ellipse 80% 80% at 100% 50%, ${colors[1]}10 0%, transparent 50%)`,
        }}
        animate={reducedMotion ? {} : {
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Content */}
      <div className="flex items-baseline gap-2 flex-wrap">
        {/* Time-based greeting */}
        <AnimatePresence mode="wait">
          <motion.span
            key={config.period}
            initial={{ opacity: 0, filter: reducedMotion ? 'blur(0px)' : 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="text-text-label text-heading-lg font-normal"
          >
            {t(config.greetingKey)},
          </motion.span>
        </AnimatePresence>

        {/* Name with BlurText */}
        <BlurText
          text={firstName}
          delay={reducedMotion ? 0 : 35}
          animateBy="chars"
          className="text-heading-lg font-semibold text-text-heading"
        />

        {/* Tagline with gradient */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: reducedMotion ? 0 : 0.4,
            delay: reducedMotion ? 0 : 0.5,
          }}
          className="text-body-md font-medium ml-1"
          style={{
            background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          — {t(config.taglineKey)}
        </motion.span>
      </div>
    </div>
  );
}

export default PersonalizedGreeting;
