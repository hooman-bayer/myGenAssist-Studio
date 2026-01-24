// ========= Copyright 2025-2026 @ Eigent.ai All Rights Reserved. =========
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ========= Copyright 2025-2026 @ Eigent.ai All Rights Reserved. =========

import AppRoutes from "@/routers/index";
import React, { useEffect, useState } from "react";
import { stackClientApp } from "@/stack/client";
import { StackProvider, StackTheme } from "@stackframe/react";
import { SplashScreen } from "@/components/SplashScreen";
import { useAuthStore } from "./store/authStore";
import { Toaster } from "sonner";
import { hasStackKeys } from "./lib";
import { useTranslation } from "react-i18next";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";

const HAS_STACK_KEYS = hasStackKeys();

function App() {
	const { setInitState } = useAuthStore();
	const [animationFinished, setAnimationFinished] = useState(false);
	const { isFirstLaunch } = useAuthStore();
	const { t } = useTranslation();

	// Proactive background token refresh
	useTokenRefresh();

	useEffect(() => {
		//  listen version update notification
		const handleUpdateNotification = (data: {
			type: string;
			currentVersion: string;
			previousVersion: string;
			reason: string;
		}) => {
			console.log("receive version update notification:", data);

			if (data.type === "version-update") {
				// handle version update logic
				console.log(
					`version from ${data.previousVersion} to ${data.currentVersion}`
				);
				console.log(`update reason: ${data.reason}`);
				setInitState("carousel");
			}
		};

		window.electronAPI?.onUpdateNotification(handleUpdateNotification);

		return () => {
			window.electronAPI?.removeAllListeners("update-notification");
		};
	}, [setInitState]);

	// render main content
	const renderMainContent = () => {
		if (isFirstLaunch && !animationFinished) {
			return (
				<SplashScreen
					onComplete={() => setAnimationFinished(true)}
					slogan={t("layout.splash-slogan")}
				/>
			);
		}
		return <AppRoutes />;
	};

	// render wrapper
	const renderWrapper = (children: React.ReactNode) => {
		if (HAS_STACK_KEYS) {
			return (
				<StackProvider app={stackClientApp}>
					<StackTheme>{children}</StackTheme>
					<Toaster style={{ zIndex: '999999 !important', position: "fixed" }} />
				</StackProvider>
			);
		}
		return (
			<>
				{children}
				<Toaster style={{ zIndex: "999999 !important", position: "fixed" }} />
			</>
		);
	};

	return renderWrapper(renderMainContent());
}

export default App;
