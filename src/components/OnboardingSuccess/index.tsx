import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import myGenAssistLogo from "@/assets/mygenassist_logo.svg";

interface OnboardingSuccessProps {
	onComplete?: () => void;
}

const SLOGANS = [
	"Your AI-powered workspace",
	"Intelligent assistance, simplified",
	"Work smarter, not harder",
	"AI that understands you",
];

const BRAND_COLORS = {
	green: "#8AD32A",
	blue: "#00BCFF",
	cyan: "#73FCFC",
	teal: "#1BC1D5",
};

// Animated checkmark SVG component
function AnimatedCheckmark() {
	return (
		<motion.svg
			width="64"
			height="64"
			viewBox="0 0 64 64"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			initial={{ scale: 0, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{
				type: "spring",
				stiffness: 200,
				damping: 15,
				delay: 0.5,
			}}
		>
			{/* Circle background with gradient */}
			<motion.circle
				cx="32"
				cy="32"
				r="30"
				stroke="url(#checkGradient)"
				strokeWidth="3"
				fill="none"
				initial={{ pathLength: 0 }}
				animate={{ pathLength: 1 }}
				transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
			/>
			{/* Checkmark path */}
			<motion.path
				d="M20 32L28 40L44 24"
				stroke="url(#checkGradient)"
				strokeWidth="4"
				strokeLinecap="round"
				strokeLinejoin="round"
				fill="none"
				initial={{ pathLength: 0 }}
				animate={{ pathLength: 1 }}
				transition={{ duration: 0.5, delay: 0.8, ease: "easeOut" }}
			/>
			<defs>
				<linearGradient id="checkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor={BRAND_COLORS.green} />
					<stop offset="50%" stopColor={BRAND_COLORS.blue} />
					<stop offset="100%" stopColor={BRAND_COLORS.cyan} />
				</linearGradient>
			</defs>
		</motion.svg>
	);
}

// Staggered text reveal component
function StaggeredText({
	text,
	delay = 0,
	className = "",
}: {
	text: string;
	delay?: number;
	className?: string;
}) {
	const words = text.split(" ");

	return (
		<span className={`inline-flex flex-wrap justify-center gap-x-2 ${className}`}>
			{words.map((word, i) => (
				<motion.span
					key={i}
					initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{
						delay: delay + i * 0.1,
						duration: 0.5,
						ease: [0.4, 0, 0.2, 1],
					}}
					className="inline-block"
				>
					{word}
				</motion.span>
			))}
		</span>
	);
}

// Gradient text component with animated gradient
function GradientText({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<motion.span
			className={className}
			style={{
				background: `linear-gradient(90deg, ${BRAND_COLORS.green}, ${BRAND_COLORS.blue}, ${BRAND_COLORS.cyan}, ${BRAND_COLORS.teal}, ${BRAND_COLORS.green})`,
				backgroundSize: "200% 100%",
				backgroundClip: "text",
				WebkitBackgroundClip: "text",
				WebkitTextFillColor: "transparent",
			}}
			animate={{
				backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
			}}
			transition={{
				duration: 4,
				repeat: Infinity,
				ease: "linear",
			}}
		>
			{children}
		</motion.span>
	);
}

// Celebration particles component
function CelebrationParticles() {
	const particles = Array.from({ length: 20 }, (_, i) => ({
		id: i,
		x: Math.random() * 100,
		delay: Math.random() * 0.5,
		duration: 2 + Math.random() * 2,
		size: 4 + Math.random() * 8,
		color: [BRAND_COLORS.green, BRAND_COLORS.blue, BRAND_COLORS.cyan, BRAND_COLORS.teal][
			Math.floor(Math.random() * 4)
		],
	}));

	return (
		<div className="absolute inset-0 overflow-hidden pointer-events-none">
			{particles.map((particle) => (
				<motion.div
					key={particle.id}
					className="absolute rounded-full"
					style={{
						width: particle.size,
						height: particle.size,
						backgroundColor: particle.color,
						left: `${particle.x}%`,
						bottom: "-10%",
					}}
					initial={{ y: 0, opacity: 0.8 }}
					animate={{
						y: "-120vh",
						opacity: [0.8, 1, 0.6, 0],
						scale: [1, 1.2, 0.8],
					}}
					transition={{
						duration: particle.duration,
						delay: particle.delay + 1,
						ease: "easeOut",
					}}
				/>
			))}
		</div>
	);
}

export function OnboardingSuccess({ onComplete }: OnboardingSuccessProps) {
	const [isVisible, setIsVisible] = useState(true);
	const [currentSloganIndex, setCurrentSloganIndex] = useState(0);
	const [showSlogan, setShowSlogan] = useState(false);

	const handleComplete = useCallback(() => {
		setIsVisible(false);
		setTimeout(() => {
			onComplete?.();
		}, 400);
	}, [onComplete]);

	useEffect(() => {
		// Show slogan after welcome message
		const sloganTimer = setTimeout(() => setShowSlogan(true), 2000);

		// Rotate slogans
		const rotationInterval = setInterval(() => {
			setCurrentSloganIndex((prev) => (prev + 1) % SLOGANS.length);
		}, 1200);

		// Complete animation after ~4.5 seconds
		const completeTimer = setTimeout(handleComplete, 4500);

		return () => {
			clearTimeout(sloganTimer);
			clearInterval(rotationInterval);
			clearTimeout(completeTimer);
		};
	}, [handleComplete]);

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
					className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center overflow-hidden"
				>
					{/* Gradient Background */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 1.5 }}
						className="absolute inset-0 pointer-events-none"
						style={{
							background: `
								radial-gradient(ellipse at 20% 20%, rgba(138, 211, 42, 0.15) 0%, transparent 50%),
								radial-gradient(ellipse at 80% 80%, rgba(0, 188, 255, 0.15) 0%, transparent 50%),
								radial-gradient(ellipse at 50% 50%, rgba(115, 252, 252, 0.1) 0%, transparent 60%),
								radial-gradient(ellipse at 70% 30%, rgba(27, 193, 213, 0.1) 0%, transparent 40%)
							`,
						}}
					/>

					{/* Animated gradient border effect */}
					<motion.div
						className="absolute inset-0 pointer-events-none"
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.3 }}
						transition={{ delay: 0.5, duration: 1 }}
					>
						<motion.div
							className="absolute top-0 left-0 right-0 h-1"
							style={{
								background: `linear-gradient(90deg, ${BRAND_COLORS.green}, ${BRAND_COLORS.blue}, ${BRAND_COLORS.cyan}, ${BRAND_COLORS.teal})`,
							}}
							animate={{
								backgroundPosition: ["0% 50%", "100% 50%"],
							}}
							transition={{
								duration: 2,
								repeat: Infinity,
								repeatType: "reverse",
							}}
						/>
					</motion.div>

					{/* Celebration particles */}
					<CelebrationParticles />

					{/* Main content container */}
					<div className="relative flex flex-col items-center z-10">
						{/* Logo with pulse/glow animation */}
						<motion.div
							className="relative mb-6"
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{
								duration: 0.6,
								ease: [0.4, 0, 0.2, 1],
							}}
						>
							{/* Glow effect behind logo */}
							<motion.div
								className="absolute inset-0 rounded-full"
								style={{
									background: `radial-gradient(circle, ${BRAND_COLORS.cyan}40 0%, transparent 70%)`,
									transform: "scale(2)",
								}}
								animate={{
									scale: [2, 2.3, 2],
									opacity: [0.4, 0.6, 0.4],
								}}
								transition={{
									duration: 2,
									repeat: Infinity,
									ease: "easeInOut",
								}}
							/>
							<motion.img
								src={myGenAssistLogo}
								alt="myGenAssist"
								className="w-20 h-20 relative z-10"
								animate={{
									scale: [1, 1.05, 1],
								}}
								transition={{
									duration: 2,
									repeat: Infinity,
									ease: "easeInOut",
								}}
							/>
						</motion.div>

						{/* Checkmark animation */}
						<div className="mb-6">
							<AnimatedCheckmark />
						</div>

						{/* Welcome message with staggered reveal */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.3 }}
							className="text-center mb-4"
						>
							<h1 className="text-3xl font-bold mb-2">
								<StaggeredText text="Welcome to" delay={0.5} className="text-gray-700" />
							</h1>
							<h2 className="text-4xl font-bold">
								<GradientText className="font-bold">
									<StaggeredText text="myGenAssist Studio" delay={0.8} />
								</GradientText>
							</h2>
						</motion.div>

						{/* Rotating slogans */}
						<motion.div
							className="h-8 flex items-center justify-center"
							initial={{ opacity: 0 }}
							animate={{ opacity: showSlogan ? 1 : 0 }}
							transition={{ duration: 0.5 }}
						>
							<AnimatePresence mode="wait">
								<motion.p
									key={currentSloganIndex}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									transition={{ duration: 0.3 }}
									className="text-lg text-gray-500 tracking-wide"
								>
									{SLOGANS[currentSloganIndex]}
								</motion.p>
							</AnimatePresence>
						</motion.div>
					</div>

					{/* Bottom gradient fade */}
					<motion.div
						className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.5 }}
						transition={{ delay: 1, duration: 1 }}
						style={{
							background: `linear-gradient(to top, rgba(138, 211, 42, 0.1), transparent)`,
						}}
					/>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export default OnboardingSuccess;
