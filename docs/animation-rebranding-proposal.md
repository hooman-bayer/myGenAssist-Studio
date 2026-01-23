# myGenAssist Animation Rebranding Proposal

## Executive Summary

This document proposes solutions for replacing Eigent-branded Lottie animations with myGenAssist branding in the myGenAssist-Studio application. After researching ReactBits and evaluating existing libraries, we recommend a hybrid approach using **Framer Motion** (already installed) combined with **selective ReactBits components** for premium text animations.

---

## 1. ReactBits Analysis

### What is ReactBits?

ReactBits (https://reactbits.dev) is an open-source collection of 110+ high-quality, animated, interactive React components created by David Haz. It provides copy-paste ready components in 4 variants: JS-CSS, JS-TW (Tailwind), TS-CSS, TS-TW.

### Available Components Relevant to Our Use Case

#### Text Animations (23 total)
| Component | Description | Relevance |
|-----------|-------------|-----------|
| **SplitText** | Staggered character/word reveal with GSAP | HIGH - Perfect for "myGenAssist Studio" reveal |
| **BlurText** | Multi-step blur-to-focus animation | HIGH - Premium reveal effect |
| **GradientText** | Animated gradient flowing through text | MEDIUM - Could match brand colors |
| **ShinyText** | Shimmer/shine sweep effect | MEDIUM - Adds polish |
| **DecryptedText** | Matrix-style letter scramble reveal | LOW - Too techy |
| **RotatingText** | Cycling text variants | LOW - Not applicable |
| **ScrollReveal** | Scroll-triggered text animations | LOW - Not for splash |
| **GlitchText** | Glitch distortion effect | LOW - Too aggressive |
| **FuzzyText** | Fuzzy hover effect | LOW - Interactive only |

#### Background Components (35+ total)
| Component | Description | Relevance |
|-----------|-------------|-----------|
| **Aurora** | Northern lights gradient effect | HIGH - Premium, brand-compatible |
| **Particles** | Floating particle system | MEDIUM - Classic splash screen look |
| **Waves** | Animated wave patterns | MEDIUM - Subtle motion |
| **Orb** | Glowing orb background | MEDIUM - Focused attention |
| **Silk** | Flowing silk effect | LOW - May be too busy |
| **Galaxy** | Space/star field | LOW - Wrong aesthetic |

### Pros of ReactBits

1. **High-Quality Animations**: Premium, polished effects out of the box
2. **Copy-Paste Ready**: No npm package needed; copy source directly
3. **Tailwind Compatible**: Matches our existing styling approach
4. **TypeScript Support**: TS variants available
5. **Customizable**: Full source access for modifications
6. **Minimal Dependencies**: Most components only need Framer Motion (already installed) or GSAP (already installed)

### Cons of ReactBits

1. **No npm Package**: Must manually copy/maintain component code
2. **GSAP Dependency for Some**: SplitText requires GSAP SplitText plugin (Club GreenSock)
3. **External CSS Files**: Some components need additional CSS files
4. **No Auto-Updates**: Manual updates required for bug fixes

### Dependency Analysis

Components that work with our existing dependencies:
- **BlurText**: Uses `motion/react` - Already have `framer-motion` and `motion`
- **GradientText**: Uses `motion/react` - Compatible
- **ShinyText**: Uses `motion/react` - Compatible
- **Aurora**: Uses `motion/react` - Compatible

Components requiring additional dependencies:
- **SplitText**: Requires `gsap` (have it) + `SplitText` plugin (Club GreenSock membership required)

---

## 2. Current Animation Analysis

### Animation 1: Opening/Splash Animation (`openning_animaiton.json`)

**Current Implementation:**
- File: `/src/assets/animation/openning_animaiton.json`
- Usage: `App.tsx` - Shows on first launch when `isFirstLaunch` is true
- Component: `AnimationJson.tsx` using `lottie-web`
- Duration: 4 seconds (240 frames @ 60fps)
- Canvas: 1440x900
- Content: Abstract icon animation (globe, document, code, paint, robot icons appearing in sequence)
- Slogan: "Your AI-powered workspace" (shown via Framer Motion after 30% progress)

**Analysis of Current Lottie:**
- Contains 5 animated icons appearing sequentially with rotation and scale animations
- No visible "Eigent" text in the JSON (searched with grep)
- Icons use generic colors, not specifically branded
- Animation is abstract/neutral - may not need full replacement

### Animation 2: Onboarding Success Animation (`onboarding_success.json`)

**Current Implementation:**
- File: `/src/assets/animation/onboarding_success.json`
- Usage: `Layout/index.tsx` - Shows after installation completes
- Content: Same icon-based animation as opening
- Slogan: Disabled (`showSlogan={false}`)

**Analysis:**
- Identical animation structure to opening
- Shows celebration after successful onboarding
- Generic abstract icons - not Eigent-specific

### Animation 3: Login Page GIF (`login.gif`)

**Current Implementation:**
- File: `/src/assets/login.gif`
- Usage: `Login.tsx` - Left pane of login page
- Dimensions: 588x804 pixels
- Content: Animated illustration (appears to be a placeholder/generic image)

**Analysis:**
- Currently displays on the left side of the login form
- Would benefit from myGenAssist branding
- Could be replaced with an animated component or branded video/GIF

---

## 3. Animation Proposals

### Proposal A: Splash Animation (Opening)

#### Recommended Approach: **Framer Motion + Custom Component**

**Rationale:** The existing Lottie doesn't contain Eigent branding in its vector paths - it uses abstract icons. However, to create a truly branded experience, we should replace it with a custom myGenAssist-themed animation.

**Visual Description:**

```
[Frame 0-1s] Background fades in with subtle Aurora/gradient effect
             myGenAssist logo (SVG) fades in at center, slightly scaled up

[Frame 1-2s] Logo settles to final size with a subtle bounce
             "myGenAssist" text begins staggered letter reveal from left

[Frame 2-3s] "Studio" text reveals below with slight delay
             Gradient shimmer sweeps across the text

[Frame 3-4s] Slogan "Your AI-powered workspace" fades in below
             Entire composition holds, then fades out
```

**Brand Colors Integration:**
- Gradient: `#8AD32A` (green) -> `#00BCFF` (blue) -> `#73FCFC` (cyan)
- Accent: `#1BC1D5` (teal)

**Implementation Complexity:** **Medium**

**Code Sketch:**

```tsx
// /src/components/SplashScreen/SplashScreen.tsx

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import myGenAssistLogo from "@/assets/mygenassist_logo.svg";

interface SplashScreenProps {
  onComplete?: () => void;
  slogan?: string;
}

export function SplashScreen({
  onComplete,
  slogan = "Your AI-powered workspace"
}: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showSlogan, setShowSlogan] = useState(false);

  useEffect(() => {
    // Show slogan after logo animation
    const sloganTimer = setTimeout(() => setShowSlogan(true), 2000);

    // Complete animation after 4 seconds
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete?.(), 400);
    }, 4000);

    return () => {
      clearTimeout(sloganTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Staggered letter animation for text
  const letterVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        delay: 1 + i * 0.05,
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    }),
  };

  const brandName = "myGenAssist";
  const subtitle = "Studio";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] bg-white flex items-center justify-center"
        >
          {/* Gradient Background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse at 30% 20%, rgba(138, 211, 42, 0.3) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 80%, rgba(0, 188, 255, 0.3) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(115, 252, 252, 0.2) 0%, transparent 70%)
              `,
            }}
          />

          {/* Main Content */}
          <div className="relative flex flex-col items-center">
            {/* Logo */}
            <motion.img
              src={myGenAssistLogo}
              alt="myGenAssist"
              className="w-24 h-24 mb-8"
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.8,
                ease: [0.4, 0, 0.2, 1],
              }}
            />

            {/* Brand Name with Gradient */}
            <div className="flex items-baseline gap-1 overflow-hidden">
              {brandName.split("").map((letter, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={letterVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-4xl font-bold"
                  style={{
                    background: "linear-gradient(90deg, #8AD32A, #00BCFF, #73FCFC)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* Subtitle */}
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.5 }}
              className="text-2xl font-medium text-gray-600 mt-2"
            >
              {subtitle}
            </motion.span>

            {/* Slogan */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: showSlogan ? 1 : 0,
                y: showSlogan ? 0 : 20
              }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="text-lg text-gray-500 mt-8 tracking-wide"
            >
              {slogan}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

### Proposal B: Onboarding Success Animation

#### Recommended Approach: **Keep Existing Lottie + Add Branded Overlay**

**Rationale:** The onboarding success animation uses the same abstract icons that don't contain Eigent branding. We can enhance it with a branded success message overlay.

**Visual Description:**
```
[Frame 0-2s] Existing icon animation plays (globe, document, etc.)
[Frame 2-4s] "Setup Complete!" text fades in with checkmark
             myGenAssist logo pulses subtly
```

**Implementation Complexity:** **Low**

**Code Sketch:**

```tsx
// Enhanced AnimationJson with success overlay
import { motion } from "framer-motion";
import myGenAssistLogo from "@/assets/mygenassist_logo.svg";

interface OnboardingSuccessProps {
  animationData: any;
  onComplete?: () => void;
}

export function OnboardingSuccess({ animationData, onComplete }: OnboardingSuccessProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  // ... existing lottie logic ...

  return (
    <div className="relative">
      {/* Existing Lottie */}
      <div id="lottie-container" />

      {/* Branded Success Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showSuccess ? 1 : 0 }}
        className="absolute inset-0 flex flex-col items-center justify-center bg-white/80"
      >
        <motion.img
          src={myGenAssistLogo}
          className="w-16 h-16 mb-4"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="flex items-center gap-2 text-2xl font-semibold"
          style={{ color: "#1BC1D5" }}
        >
          <CheckIcon className="w-8 h-8" />
          <span>Setup Complete!</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
```

---

### Proposal C: Login Page Animation

#### Recommended Approach: **Replace GIF with Animated Component**

**Option C1: Aurora Background + Floating Elements**

**Visual Description:**
```
Aurora gradient background with subtle animation
Floating abstract shapes (circles, lines) in brand colors
myGenAssist logo watermark in background
Optional: Animated grid pattern
```

**Implementation Complexity:** **Medium**

**Option C2: Keep Static Image with Brand Colors**

Replace the GIF with a static illustration or create a new branded GIF/video.

**Implementation Complexity:** **Low**

**Recommended: Option C1 - Aurora Background**

**Code Sketch:**

```tsx
// /src/components/LoginBackground/LoginBackground.tsx

import { motion } from "framer-motion";

export function LoginBackground() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl">
      {/* Aurora Gradient Base */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(ellipse at 0% 0%, rgba(138, 211, 42, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(0, 188, 255, 0.4) 0%, transparent 50%)",
            "radial-gradient(ellipse at 100% 0%, rgba(115, 252, 252, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 0% 100%, rgba(27, 193, 213, 0.4) 0%, transparent 50%)",
            "radial-gradient(ellipse at 50% 50%, rgba(138, 211, 42, 0.3) 0%, transparent 60%), radial-gradient(ellipse at 0% 0%, rgba(0, 188, 255, 0.4) 0%, transparent 50%)",
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear",
        }}
      />

      {/* Floating Orbs */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-30"
          style={{
            width: 100 + i * 50,
            height: 100 + i * 50,
            background: `linear-gradient(135deg, #8AD32A, #00BCFF)`,
            left: `${20 + i * 15}%`,
            top: `${10 + i * 20}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 188, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 188, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Centered Logo Watermark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.img
          src="/mygenassist_logo.svg"
          alt=""
          className="w-48 h-48 opacity-10"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </div>
  );
}
```

---

## 4. Implementation Plan

### Phase 1: Splash Screen (Priority: HIGH)
**Estimated Effort:** 4-6 hours

1. Create `SplashScreen` component with Framer Motion
2. Implement staggered text reveal for "myGenAssist Studio"
3. Add gradient background effect
4. Integrate brand colors and logo
5. Update `App.tsx` to use new component
6. Test animation timing and transitions
7. Remove Lottie file dependency from splash

### Phase 2: Login Background (Priority: MEDIUM)
**Estimated Effort:** 2-4 hours

1. Create `LoginBackground` component
2. Implement Aurora gradient animation
3. Add floating orbs and grid pattern
4. Replace GIF in `Login.tsx`
5. Test responsiveness and performance

### Phase 3: Onboarding Success (Priority: LOW)
**Estimated Effort:** 1-2 hours

1. Keep existing Lottie (non-branded icons)
2. Add branded success overlay
3. Update `Layout/index.tsx` integration
4. Test complete onboarding flow

### Total Estimated Effort: 7-12 hours

---

## 5. Dependencies

### Required (Already Installed)
- `framer-motion` ^12.17.0 - All animations
- `motion` ^12.23.24 - Additional motion utilities
- `gsap` ^3.13.0 - Optional for advanced animations

### Optional (If Using ReactBits SplitText)
- `@gsap/react` ^2.1.2 - Already installed
- GSAP SplitText Plugin - Requires Club GreenSock membership (~$99/year)

### Recommendation
**Do not add ReactBits as a dependency.** Instead:
1. Use Framer Motion for all animations (already have it)
2. If premium text effects needed, copy ReactBits `BlurText` component source code
3. Avoid SplitText to prevent GSAP plugin licensing requirements

---

## 6. Code Examples

### Example 1: BlurText Staggered Reveal (Adapted from ReactBits)

```tsx
// /src/components/ui/BlurText.tsx

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

  const elements = animateBy === "words"
    ? text.split(" ")
    : text.split("");

  return (
    <p ref={ref} className={`flex flex-wrap justify-center ${className}`}>
      {elements.map((element, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
          animate={isInView ? {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
          } : {}}
          transition={{
            delay: i * (delay / 1000),
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
          }}
          onAnimationComplete={i === elements.length - 1 ? onAnimationComplete : undefined}
          className="inline-block"
        >
          {element}
          {animateBy === "words" && <span>&nbsp;</span>}
        </motion.span>
      ))}
    </p>
  );
}
```

### Example 2: Gradient Text Animation

```tsx
// /src/components/ui/GradientText.tsx

import { motion, useAnimationFrame, useMotionValue, useTransform } from "framer-motion";
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

  useAnimationFrame((time, delta) => {
    elapsedRef.current += delta;
    const cycleTime = (elapsedRef.current / 1000) % (animationSpeed * 2);

    if (cycleTime < animationSpeed) {
      progress.set((cycleTime / animationSpeed) * 100);
    } else {
      progress.set(100 - ((cycleTime - animationSpeed) / animationSpeed) * 100);
    }
  });

  const backgroundPosition = useTransform(progress, p => `${p}% 50%`);

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
```

### Example 3: Complete Splash Screen Implementation

```tsx
// /src/components/SplashScreen/index.tsx

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import myGenAssistLogo from "@/assets/mygenassist_logo.svg";
import { BlurText } from "@/components/ui/BlurText";
import { GradientText } from "@/components/ui/GradientText";

interface SplashScreenProps {
  onComplete?: () => void;
  slogan?: string;
}

export function SplashScreen({
  onComplete,
  slogan = "Your AI-powered workspace"
}: SplashScreenProps) {
  const [phase, setPhase] = useState<"logo" | "text" | "slogan" | "exit">("logo");
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center overflow-hidden"
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
              opacity: phase !== "logo" ? 1 : [0, 1],
              scale: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
              ease: [0.4, 0, 0.2, 1],
            }}
          />

          {/* Brand Name */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase !== "logo" ? 1 : 0 }}
            className="text-center"
          >
            <GradientText
              colors={["#8AD32A", "#00BCFF", "#73FCFC", "#1BC1D5", "#8AD32A"]}
              animationSpeed={4}
              className="text-4xl font-bold tracking-tight"
            >
              <BlurText
                text="myGenAssist"
                delay={80}
                animateBy="chars"
              />
            </GradientText>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: phase !== "logo" ? 1 : 0,
                y: phase !== "logo" ? 0 : 10,
              }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-2xl font-medium text-gray-600 mt-1"
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
            className="absolute bottom-[20%] text-lg text-gray-500 tracking-wide"
          >
            {slogan}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 7. Summary & Recommendations

### Recommended Approach

1. **Do NOT add ReactBits as npm dependency** - Copy only the components you need
2. **Use Framer Motion as primary animation library** - Already installed, well-documented
3. **Create custom branded components** - Full control over branding
4. **Keep abstract Lottie animations** - They don't contain Eigent branding

### Files to Create

1. `/src/components/SplashScreen/index.tsx` - New branded splash screen
2. `/src/components/ui/BlurText.tsx` - Staggered text reveal component
3. `/src/components/ui/GradientText.tsx` - Animated gradient text
4. `/src/components/LoginBackground/LoginBackground.tsx` - Aurora-style background

### Files to Modify

1. `/src/App.tsx` - Replace `AnimationJson` with `SplashScreen`
2. `/src/pages/Login.tsx` - Replace `login.gif` with `LoginBackground`
3. `/src/components/Layout/index.tsx` - Optionally enhance onboarding animation

### Timeline

| Phase | Task | Effort | Priority |
|-------|------|--------|----------|
| 1 | Splash Screen Component | 4-6 hours | HIGH |
| 2 | Login Background | 2-4 hours | MEDIUM |
| 3 | Onboarding Enhancement | 1-2 hours | LOW |
| **Total** | | **7-12 hours** | |

---

## References

- ReactBits: https://reactbits.dev
- ReactBits GitHub: https://github.com/DavidHDev/react-bits
- Framer Motion: https://www.framer.com/motion/
- GSAP: https://greensock.com/gsap/
- myGenAssist Brand Assets: `/src/assets/mygenassist_logo.svg`, `/src/assets/mygenassist_text_logo.svg`

---

*Document created: January 2026*
*Author: AI Assistant*
