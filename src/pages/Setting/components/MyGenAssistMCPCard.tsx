import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Shield, Server } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MyGenAssistMCPCardProps {
	endpoint: string;
	token: string | null;
	isInstalled: boolean;
	isEnabled: boolean;
	isLoading: boolean;
	onInstall: () => Promise<void>;
	onUninstall: () => Promise<void>;
	onToggle: (enabled: boolean) => Promise<void>;
}

export default function MyGenAssistMCPCard({
	endpoint,
	token,
	isInstalled,
	isEnabled,
	isLoading,
	onInstall,
	onUninstall,
	onToggle,
}: MyGenAssistMCPCardProps) {
	const { t } = useTranslation();
	const [expanded, setExpanded] = useState(false);

	// Mask the token for display, showing only first 8 and last 4 chars
	const maskedToken = useMemo(() => {
		if (!token) return "••••••••";
		if (token.length <= 16) return "••••••••";
		return `${token.slice(0, 8)}...${token.slice(-4)}`;
	}, [token]);

	// Determine environment from endpoint
	const environment = useMemo(() => {
		if (!endpoint) return "unknown";
		if (endpoint.includes("dev.chat.int.bayer.com")) return "dev";
		if (endpoint.includes("chat.int.bayer.com")) return "prod";
		return "custom";
	}, [endpoint]);

	// Generate the MCP config JSON for display
	const configJson = useMemo(() => {
		const config = {
			mcpServers: {
				mygenassist: {
					command: "npx",
					args: [
						"-y",
						"mcp-remote",
						endpoint || "https://dev.chat.int.bayer.com/api/v3/mcp",
						"--header",
						"Authorization:${AUTH_HEADER}",
					],
					env: {
						AUTH_HEADER: `Bearer ${maskedToken}`,
						MCP_REMOTE_CONFIG_DIR: "~/.mcp-auth",
					},
				},
			},
		};
		return JSON.stringify(config, null, 2);
	}, [endpoint, maskedToken]);

	return (
		<div className="w-full bg-surface-secondary rounded-2xl overflow-hidden border border-border-secondary">
			{/* Header */}
			<div className="px-6 pt-6 pb-4">
				<div className="flex items-start justify-between">
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center gap-3">
							<h2 className="text-body-lg font-bold text-text-heading">
								{t("setting.mygenassist-mcp")}
							</h2>
							{isInstalled && isEnabled && (
								<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
									<span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
									{t("setting.connected")}
								</span>
							)}
						</div>
						<p className="text-body-sm text-text-label">
							{t("setting.connected-to-bayer-ai-platform")}
						</p>
					</div>

					{/* Enable/Disable toggle or Install button */}
					{isInstalled ? (
						<div className="flex items-center gap-3">
							<span className="text-sm text-text-label">
								{isEnabled ? t("setting.enable") : t("setting.disabled")}
							</span>
							<Switch
								checked={isEnabled}
								onCheckedChange={onToggle}
								disabled={isLoading}
							/>
						</div>
					) : (
						<Button
							variant="primary"
							size="sm"
							onClick={onInstall}
							disabled={isLoading || !token || !endpoint}
						>
							{isLoading ? t("setting.installing") : t("setting.install")}
						</Button>
					)}
				</div>
			</div>

			{/* SSO Info Banner */}
			<div className="mx-6 mb-4 px-4 py-3 rounded-xl flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30">
				<Shield className="w-4 h-4 flex-shrink-0 text-green-600 dark:text-green-400" />
				<p className="text-xs text-text-label">
					{t("setting.sso-token-managed-automatically")} &bull;{" "}
					{t("setting.endpoint")}: {environment}
				</p>
			</div>

			{/* Expandable Configuration Section */}
			<div className="mx-6 mb-4">
				<button
					type="button"
					onClick={() => setExpanded(!expanded)}
					className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface-tertiary hover:bg-surface-secondary-hover transition-colors cursor-pointer border-0"
				>
					<div className="flex items-center gap-2">
						<Server className="w-4 h-4 text-text-label" />
						<span className="text-sm font-medium text-text-body">
							{t("setting.configuration")}
						</span>
					</div>
					{expanded ? (
						<ChevronUp className="w-4 h-4 text-text-label" />
					) : (
						<ChevronDown className="w-4 h-4 text-text-label" />
					)}
				</button>

				{/* Expanded JSON Config */}
				{expanded && (
					<div className="mt-2 p-4 rounded-xl bg-surface-tertiary border border-border-secondary overflow-auto">
						<pre className="text-xs text-text-body font-mono whitespace-pre-wrap break-all">
							{configJson}
						</pre>
					</div>
				)}
			</div>

			{/* Footer with uninstall option when installed */}
			{isInstalled && (
				<div className="flex justify-end px-6 py-4 border-t border-border-secondary">
					<Button
						variant="ghost"
						size="sm"
						className="!text-text-label"
						onClick={onUninstall}
						disabled={isLoading}
					>
						{t("setting.uninstall")}
					</Button>
				</div>
			)}
		</div>
	);
}
