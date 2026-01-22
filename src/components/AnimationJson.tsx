import lottie from "lottie-web";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function AnimationJson({
	animationData = "",
	onComplete,
	showSlogan = true,
	slogan = "Your AI-powered workspace",
}: {
	animationData: any;
	onComplete?: () => void;
	showSlogan?: boolean;
	slogan?: string;
}) {
	const [animationProgress, setAnimationProgress] = useState(0);
	const [isVisible, setIsVisible] = useState(true);

	useEffect(() => {
		const container = document.getElementById("lottie-container");
		if (!container) return;

		const animation = lottie.loadAnimation({
			container,
			renderer: "svg",
			loop: false,
			autoplay: true,
			animationData,
		});

		// Track animation progress for slogan timing
		animation.addEventListener("enterFrame", () => {
			const progress = animation.currentFrame / animation.totalFrames;
			setAnimationProgress(progress);
		});

		// Listen to animation completion
		animation.addEventListener("complete", () => {
			console.log("animation completed");
			// Start fade out
			setIsVisible(false);
			// Call onComplete after fade out animation
			setTimeout(() => {
				onComplete?.();
			}, 400);
		});

		return () => {
			animation.destroy();
		};
	}, [animationData, onComplete]);

	// Show slogan after logo appears (around 30% progress for better timing with Eigent animation)
	const showSloganText = showSlogan && animationProgress > 0.3;

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
					className="fixed inset-0 h-full w-full z-[9999] bg-white"
				>
					{/* Lottie animation container - full screen like original */}
					<div
						id="lottie-container"
						className="fixed inset-0 h-full w-full"
					/>

					{/* Slogan text with animation */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{
							opacity: showSloganText ? 1 : 0,
							y: showSloganText ? 0 : 20,
						}}
						transition={{
							duration: 0.6,
							ease: [0.4, 0, 0.2, 1],
							delay: 0.1,
						}}
						className="fixed bottom-[20%] left-0 right-0 text-center z-[10000]"
					>
						<p className="text-lg font-medium text-gray-600 tracking-wide">
							{slogan}
						</p>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
