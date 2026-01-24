import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Circle,
	Settings,
	Eye,
	EyeOff,
	Info,
	RotateCcw,
	Loader2,
	Check,
	Lock,
	Shield,
} from "lucide-react";
import { INIT_PROVODERS } from "@/lib/llm";
import { Provider } from "@/types";
import {
	proxyFetchPost,
	proxyFetchGet,
	proxyFetchPut,
	proxyFetchDelete,
	fetchPost,
} from "@/api/http";
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/authStore";
import { getValidToken } from "@/lib/tokenManager";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const LOCAL_PROVIDER_NAMES = ["ollama", "vllm", "sglang", "lmstudio"];

export default function SettingModels() {
	const { modelType, cloud_model_type, setModelType, setCloudModelType, token } =
		useAuthStore();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const getValidateMessage = (res: any) =>
		res?.message ??
		res?.detail?.message ??
		res?.detail?.error?.message ??
		res?.error?.message ??
		t("setting.validate-failed");
	const [items, setItems] = useState<Provider[]>(
		INIT_PROVODERS.filter((p) => p.id !== "local")
	);
	const [form, setForm] = useState(() =>
		INIT_PROVODERS.filter((p) => p.id !== "local").map((p) => ({
			apiKey: p.apiKey,
			apiHost: p.apiHost,
			is_valid: p.is_valid ?? false,
			model_type: p.model_type ?? "",
			externalConfig: p.externalConfig
				? p.externalConfig.map((ec) => ({ ...ec }))
				: undefined,
			provider_id: p.provider_id ?? undefined,
			prefer: p.prefer ?? false,
		}))
	);
	const [showApiKey, setShowApiKey] = useState(() =>
		INIT_PROVODERS.filter((p) => p.id !== "local").map(() => false)
	);
	const [loading, setLoading] = useState<number | null>(null);
	const [errors, setErrors] = useState<
		{ apiKey?: string; apiHost?: string; model_type?: string; externalConfig?: string }[]
	>(() =>
		INIT_PROVODERS.filter((p) => p.id !== "local").map(() => ({
			apiKey: "",
			apiHost: "",
		}))
	);
	// Local Model independent state
	const [localEnabled, setLocalEnabled] = useState(true);
	const [localPlatform, setLocalPlatform] = useState("ollama");
	const [localEndpoint, setLocalEndpoint] = useState("");
	const [localType, setLocalType] = useState("");
	const [localVerifying, setLocalVerifying] = useState(false);
	const [localError, setLocalError] = useState<string | null>(null);
	const [localInputError, setLocalInputError] = useState(false);
	const [localPrefer, setLocalPrefer] = useState(false); // Local model prefer state
	const [localProviderId, setLocalProviderId] = useState<number | undefined>(
		undefined
	); // Local model provider_id

	// Load provider list and populate form
	useEffect(() => {
		(async () => {
			try {
				const res = await proxyFetchGet("/api/providers");
				const providerList = Array.isArray(res) ? res : res.items || [];
				// Handle custom models
				setForm((f) =>
					f.map((fi, idx) => {
						const item = items[idx];
						const found = providerList.find(
							(p: any) => p.provider_name === item.id
						);
						if (found) {
							const isOpenAICompatible = item.id === 'openai-compatible-model';
							return {
								...fi,
								provider_id: found.id,
								// Use live SSO token for OpenAI Compatible, ignore saved value
								apiKey: isOpenAICompatible ? (token || "") : (found.api_key || ""),
								apiHost: found.endpoint_url || "",
								is_valid: !!found?.is_valid,
								prefer: found.prefer ?? false,
								model_type: found.model_type ?? "",
								externalConfig: fi.externalConfig
									? fi.externalConfig.map((ec) => {
										if (
											found.encrypted_config &&
											found.encrypted_config[ec.key] !== undefined
										) {
											return { ...ec, value: found.encrypted_config[ec.key] };
										}
										return ec;
									})
									: undefined,
							};
						}
						return fi;
					})
				);
				// Handle local model
				const local = providerList.find(
					(p: any) => LOCAL_PROVIDER_NAMES.includes(p.provider_name)
				);
				console.log(123123, local);
				if (local) {
					setLocalEndpoint(local.endpoint_url || "");
					setLocalPlatform(
						local.encrypted_config?.model_platform ||
						local.provider_name ||
						"ollama"
					);
					setLocalType(local.encrypted_config?.model_type || "llama3.2");
					setLocalEnabled(local.is_valid ?? true);
					setLocalPrefer(local.prefer ?? false);
					setLocalProviderId(local.id);
				}
				if (modelType === "local") {
					setLocalEnabled(true);
					setForm((f) => f.map((fi) => ({ ...fi, prefer: false })));
					setLocalPrefer(true);
				} else {
					setLocalPrefer(false);
				}
			} catch (e) {
				// ignore error
			}
		})();
	}, []);

	// Auto-fill and auto-update API key with SSO token for OpenAI Compatible
	useEffect(() => {
		if (token) {
			setForm((f) =>
				f.map((fi, idx) => {
					if (items[idx]?.id === 'openai-compatible-model') {
						// Always use live SSO token for myGenAssist API
						return { ...fi, apiKey: token };
					}
					return fi;
				})
			);
		}
	}, [token, items]);

	// Helper to detect auth errors by message content (since backend returns 400 for all errors)
	const isAuthError = (error: any): boolean => {
		const msg = (
			error?.message ||
			error?.detail?.message ||
			error?.detail?.error?.message ||
			error?.error?.message ||
			JSON.stringify(error)
		).toLowerCase();

		return (
			msg.includes('invalid_api_key') ||
			msg.includes('incorrect api key') ||
			msg.includes('unauthorized') ||
			msg.includes('forbidden') ||
			msg.includes('401') ||
			msg.includes('403') ||
			(msg.includes('token') && (msg.includes('expired') || msg.includes('invalid')))
		);
	};

	const handleVerify = async (idx: number, isRetrying: boolean = false) => {
		const { apiKey, apiHost, externalConfig, model_type, provider_id } =
			form[idx];
		let hasError = false;
		const newErrors = [...errors];
		if (items[idx].id !== "local") {
			if (!apiKey || apiKey.trim() === "") {
				newErrors[idx].apiKey = t("setting.api-key-can-not-be-empty");
				hasError = true;
			} else {
				newErrors[idx].apiKey = "";
			}
		}
		if (!apiHost || apiHost.trim() === "") {
			newErrors[idx].apiHost = t("setting.api-host-can-not-be-empty");
			hasError = true;
		} else {
			newErrors[idx].apiHost = "";
		}
		if (!model_type || model_type.trim() === "") {
			newErrors[idx].model_type = t("setting.model-type-can-not-be-empty");
			hasError = true;
		} else {
			newErrors[idx].model_type = "";
		}
		setErrors(newErrors);
		if (hasError) return;

		setLoading(idx);
		const item = items[idx];
		let external: any = {};
		if (form[idx]?.externalConfig) {
			form[idx]?.externalConfig.map((item) => {
				external[item.key] = item.value;
			});
		}

		console.log(form[idx]);
		try {
			const res = await fetchPost("/model/validate", {
				model_platform: item.id,
				model_type: form[idx].model_type,
				api_key: form[idx].apiKey,
				url: form[idx].apiHost,
				extra_params: external,
			});
			if (res.is_tool_calls && res.is_valid) {
				console.log("success");
				toast(t("setting.validate-success"), {
					description: t("setting.model-function-calling-verified"),
					closeButton: true,
				});
			} else {
				console.log("failed", res.message);
				// Surface error inline on API Key input
				setErrors((prev) => {
					const next = [...prev];
					if (!next[idx]) next[idx] = {} as any;
					next[idx].apiKey = getValidateMessage(res);
					return next;
				});
				return;
			}
			console.log(res);
		} catch (e) {
			// For myGenAssist (OpenAI Compatible), try silent token refresh on auth errors
			const isMyGenAssist = items[idx]?.id === 'openai-compatible-model';

			if (isMyGenAssist && isAuthError(e) && !isRetrying) {
				console.log('[Models] Auth error detected, attempting token refresh...');
				const freshToken = await getValidToken();

				if (freshToken && freshToken !== form[idx].apiKey) {
					console.log('[Models] Token refreshed, retrying validation...');
					// Update form with fresh token
					setForm(f => f.map((fi, i) =>
						i === idx ? { ...fi, apiKey: freshToken } : fi
					));
					// Retry with fresh token (isRetrying=true prevents infinite loop)
					setLoading(null);
					return handleVerify(idx, true);
				}

				// Token refresh failed - show clear message to re-login
				if (!freshToken) {
					console.log('[Models] Token refresh failed, prompting re-login');
					setErrors((prev) => {
						const next = [...prev];
						if (!next[idx]) next[idx] = {} as any;
						next[idx].apiKey = t("setting.sso-session-expired-please-logout-and-login");
						return next;
					});
					return;
				}
			}

			// Show error only if refresh didn't help or not applicable
			console.log(e);
			// Network/exception case: show inline error
			setErrors((prev) => {
				const next = [...prev];
				if (!next[idx]) next[idx] = {} as any;
				next[idx].apiKey = getValidateMessage(e);
				return next;
			});
			return;
		} finally {
			setLoading(null);
		}

		const isOpenAICompatible = item.id === 'openai-compatible-model';
		const data: any = {
			provider_name: item.id,
			// Don't save SSO token - it changes every hour
			api_key: isOpenAICompatible ? '' : form[idx].apiKey,
			endpoint_url: form[idx].apiHost,
			is_valid: form[idx].is_valid,
			model_type: form[idx].model_type,
		};
		if (externalConfig) {
			data.encrypted_config = {};
			externalConfig.forEach((ec) => {
				data.encrypted_config[ec.key] = ec.value;
			});
		}
		try {
			if (provider_id) {
				await proxyFetchPut(`/api/provider/${provider_id}`, data);
			} else {
				await proxyFetchPost("/api/provider", data);
			}
			// add: refresh provider list after saving, update form and switch editable status
			const res = await proxyFetchGet("/api/providers");
			const providerList = Array.isArray(res) ? res : res.items || [];
			// Find the saved provider to get its id for handleSwitch (avoids stale state)
			const savedProvider = providerList.find(
				(p: any) => p.provider_name === item.id
			);
			setForm((f) =>
				f.map((fi, i) => {
					const formItem = items[i];
					const found = providerList.find(
						(p: any) => p.provider_name === formItem.id
					);
					if (found) {
						const isOpenAICompatible = formItem.id === 'openai-compatible-model';
						return {
							...fi,
							provider_id: found.id,
							// Use live SSO token for OpenAI Compatible, ignore saved value
							apiKey: isOpenAICompatible ? token : (found.api_key || ""),
							apiHost: found.endpoint_url || "",
							is_valid: !!found.is_valid,
							prefer: found.prefer ?? false,
							externalConfig: fi.externalConfig
								? fi.externalConfig.map((ec) => {
									if (
										found.encrypted_config &&
										found.encrypted_config[ec.key] !== undefined
									) {
										return { ...ec, value: found.encrypted_config[ec.key] };
									}
									return ec;
								})
								: undefined,
						};
					}
					return fi;
				})
			);
			// Pass provider_id directly to avoid reading stale form state
			if (savedProvider?.id) {
				handleSwitch(idx, true, savedProvider.id);
			}
		} finally {
			setLoading(null);
		}
	};

	// Local Model verification
	const handleLocalVerify = async () => {
		setLocalVerifying(true);
		setLocalError(null);
		setLocalInputError(false);
		if (!localEndpoint) {
			setLocalError(t("setting.endpoint-url-can-not-be-empty"));
			setLocalInputError(true);
			setLocalVerifying(false);
			return;
		}
		try {
			// // 1. Check if endpoint returns response
			// let baseUrl = localEndpoint;
			// let testUrl = baseUrl;
			// let testMethod = "GET";
			// let testBody = undefined;

			// // Extract base URL if it contains specific endpoints
			// if (baseUrl.includes('/chat/completions')) {
			// 	baseUrl = baseUrl.replace('/chat/completions', '');
			// } else if (baseUrl.includes('/completions')) {
			// 	baseUrl = baseUrl.replace('/completions', '');
			// }

			// // Always test with chat completions endpoint for OpenAI-compatible APIs
			// testUrl = `${baseUrl}/chat/completions`;
			// testMethod = "POST";
			// testBody = JSON.stringify({
			// 	model: localType || "test",
			// 	messages: [{ role: "user", content: "test" }],
			// 	max_tokens: 1,
			// 	stream: false
			// });

			// const resp = await fetch(testUrl, {
			// 	method: testMethod,
			// 	headers: {
			// 		"Content-Type": "application/json",
			// 		"Authorization": "Bearer dummy"
			// 	},
			// 	body: testBody
			// });

			// if (!resp.ok) {
			// 	throw new Error("Endpoint is not responding");
			// }

			try {
				const res = await fetchPost("/model/validate", {
					model_platform: localPlatform,
					model_type: localType,
					api_key: "not-required",
					url: localEndpoint,
				});
				if (res.is_tool_calls && res.is_valid) {
					console.log("success");
					toast(t("setting.validate-success"), {
						description: t("setting.model-function-calling-verified"),
						closeButton: true,
					});
				} else {
					console.log("failed", res.message);
					const toastId = toast(t("setting.validate-failed"), {
						description: getValidateMessage(res),
						action: {
							label: t("setting.close"),
							onClick: () => {
								toast.dismiss(toastId);
							},
						},
					});

					return;
				}
				console.log(res);
			} catch (e) {
				console.log(e);
				const toastId = toast(t("setting.validate-failed"), {
					description: getValidateMessage(e),
					action: {
						label: t("setting.close"),
						onClick: () => {
							toast.dismiss(toastId);
						},
					},
				});
				return;
			} finally {
				setLoading(null);
			}

			// 2. Save to /api/provider/ (save only base URL)
			const data: any = {
				provider_name: localPlatform,
				api_key: "not-required",
				endpoint_url: localEndpoint, // Save base URL without specific endpoints
				is_valid: true,
				model_type: localType,
				encrypted_config: {
					model_platform: localPlatform,
					model_type: localType,
				},
			};
			await proxyFetchPost("/api/provider", data);
			setLocalError(null);
			setLocalInputError(false);
			// add: refresh provider list after saving, update localProviderId and localPrefer
			const res = await proxyFetchGet("/api/providers");
			const providerList = Array.isArray(res) ? res : res.items || [];
			const local = providerList.find(
				(p: any) => p.provider_name === localPlatform
			);
			if (local) {
				setLocalProviderId(local.id);
				setLocalPrefer(local.prefer ?? false);
				setLocalPlatform(
					local.encrypted_config?.model_platform ||
					local.provider_name ||
					localPlatform
				);
				await handleLocalSwitch(true, local.id);
			}
		} catch (e: any) {
			setLocalError(
				e.message || t("setting.verification-failed-please-check-endpoint-url")
			);
			setLocalInputError(true);
		} finally {
			setLocalVerifying(false);
		}
	};

	const [activeModelIdx, setActiveModelIdx] = useState<number | null>(null); // Current active model idx

	// Switch linkage logic: only one switch can be enabled
	useEffect(() => {
		if (activeModelIdx !== null) {
			setLocalEnabled(false);
		} else {
			setLocalEnabled(true);
		}
	}, [activeModelIdx]);
	useEffect(() => {
		if (localEnabled) {
			setActiveModelIdx(null);
		}
	}, [localEnabled]);

	const handleSwitch = async (idx: number, checked: boolean, providerId?: number) => {
		if (!checked) {
			setActiveModelIdx(null);
			setLocalEnabled(true);
			return;
		}
		const hasSearchKey = await checkHasSearchKey();
		if (!hasSearchKey) {
			// Show warning toast instead of blocking
			toast(t("setting.warning-google-search-not-configured"), {
				description: t(
					"setting.search-functionality-may-be-limited-without-google-api"
				),
				closeButton: true,
			});
		}
		// Use passed providerId if available (avoids stale state), otherwise fall back to form state
		const targetProviderId = providerId ?? form[idx].provider_id;
		if (!targetProviderId) return; // Guard against undefined
		try {
			await proxyFetchPost("/api/provider/prefer", {
				provider_id: targetProviderId,
			});
			setModelType("custom");
			setActiveModelIdx(idx);
			setLocalEnabled(false);
			setForm((f) => f.map((fi, i) => ({ ...fi, prefer: i === idx }))); // Only one prefer allowed
			setLocalPrefer(false);
		} catch (e) {
			// Optional: add error message
		}
	};
	const handleLocalSwitch = async (checked: boolean, providerId?: number) => {
		if (!checked) {
			setLocalEnabled(false);
			return;
		}
		const hasSearchKey = await checkHasSearchKey();
		if (!hasSearchKey) {
			// Show warning toast instead of blocking
			toast(t("setting.warning-google-search-not-configured"), {
				description: t(
					"setting.search-functionality-may-be-limited-without-google-api"
				),
				closeButton: true,
			});
		}
		try {
			const targetProviderId =
				providerId !== undefined ? providerId : localProviderId;
			if (targetProviderId === undefined) return;
			await proxyFetchPost("/api/provider/prefer", {
				provider_id: targetProviderId,
			});
			setModelType("local");
			setLocalEnabled(true);
			setActiveModelIdx(null);
			setForm((f) => f.map((fi) => ({ ...fi, prefer: false }))); // Set all others' prefer to false
			setLocalPrefer(true);
		} catch (e) {
			// Optional: add error message
		}
	};

	const handleLocalReset = async () => {
		try {
			if (localProviderId !== undefined) {
				await proxyFetchDelete(`/api/provider/${localProviderId}`);
			}
			setLocalEndpoint("");
			setLocalType("");
			setLocalPrefer(false);
			setLocalProviderId(undefined);
			setLocalEnabled(true);
			setActiveModelIdx(null);
			toast.success(t("setting.reset-success"));
		} catch (e) {
			toast.error(t("setting.reset-failed"));
		}
	};
	const handleDelete = async (idx: number) => {
		try {
			const { provider_id } = form[idx];
			if (provider_id) {
				await proxyFetchDelete(`/api/provider/${provider_id}`);
			}
			// reset single form entry to defaults from INIT_PROVODERS
			setForm((prev) =>
				prev.map((fi, i) => {
					if (i !== idx) return fi;
					const item = items[i];
					const isOpenAICompatible = item.id === 'openai-compatible-model';
					// Find default values from INIT_PROVODERS
					const defaultProvider = INIT_PROVODERS.find(p => p.id === item.id);
					return {
						// Use live SSO token for OpenAI Compatible after reset
						apiKey: isOpenAICompatible ? (token || "") : "",
						apiHost: defaultProvider?.apiHost || "",
						is_valid: false,
						model_type: defaultProvider?.model_type || "",
						externalConfig: item.externalConfig
							? item.externalConfig.map((ec) => ({ ...ec, value: "" }))
							: undefined,
						provider_id: undefined,
						prefer: false,
					};
				})
			);
			setErrors((prev) =>
				prev.map((er, i) => (i === idx ? { apiKey: "", apiHost: "", model_type: "" } as any : er))
			);
			if (activeModelIdx === idx) {
				setActiveModelIdx(null);
				setLocalEnabled(true);
			}
			toast.success(t("setting.reset-success"));
		} catch (e) {
			toast.error(t("setting.reset-failed"));
		}
	};

	// removed bulk reset; only single-provider delete is supported

	const checkHasSearchKey = async () => {
		const configsRes = await proxyFetchGet("/api/configs");
		const configs = Array.isArray(configsRes) ? configsRes : [];
		console.log(configsRes, configs);
		const _hasApiKey = configs.find(
			(item) => item.config_name === "GOOGLE_API_KEY"
		);
		const _hasApiId = configs.find(
			(item) => item.config_name === "SEARCH_ENGINE_ID"
		);
		return _hasApiKey && _hasApiId;
	};

	// Find the openai-compatible-model index for the myGenAssist card
	const myGenAssistIdx = items.findIndex(item => item.id === 'openai-compatible-model');
	const myGenAssistForm = myGenAssistIdx >= 0 ? form[myGenAssistIdx] : null;
	const myGenAssistItem = myGenAssistIdx >= 0 ? items[myGenAssistIdx] : null;
	const isConfigured = myGenAssistForm?.provider_id !== undefined;
	const canSwitch = !!myGenAssistForm?.provider_id;

	return (
		<div className="flex flex-col gap-6 pb-40">
			{/* myGenAssist Connection Card */}
			{myGenAssistIdx >= 0 && myGenAssistForm && myGenAssistItem && (
				<div className="w-full bg-surface-secondary rounded-2xl overflow-hidden border border-border-secondary">
					{/* Header */}
					<div className="px-6 pt-6 pb-4">
						<div className="flex items-start justify-between">
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center gap-3">
									<h2 className="text-body-lg font-bold text-text-heading">
										{t("setting.mygenassist")}
									</h2>
									{isConfigured && (
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

							{/* Default button */}
							{myGenAssistForm.prefer ? (
								<Button
									variant="success"
									size="sm"
									className="focus-none"
									disabled={!canSwitch || loading === myGenAssistIdx}
									onClick={() => handleSwitch(myGenAssistIdx, false)}
								>
									{t("setting.default")}
									<Check className="w-4 h-4 ml-1" />
								</Button>
							) : (
								<Button
									variant="ghost"
									size="sm"
									disabled={!canSwitch || loading === myGenAssistIdx}
									onClick={() => handleSwitch(myGenAssistIdx, true)}
									className={canSwitch ? "!text-text-label" : ""}
								>
									{!canSwitch ? t("setting.not-configured") : t("setting.set-as-default")}
								</Button>
							)}
						</div>
					</div>

					{/* SSO Info Banner */}
					<div className="mx-6 mb-4 px-4 py-3 rounded-xl flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30">
						<Shield className="w-4 h-4 flex-shrink-0 text-green-600 dark:text-green-400" />
						<p className="text-xs text-text-label">
							{t("setting.sso-managed-credentials")}
						</p>
					</div>

					{/* Form Fields - Read Only */}
					<div className="px-6 pb-4 flex flex-col gap-4">
						{/* Access Token - Editable for SSO troubleshooting */}
						<Input
							id={`apiKey-${myGenAssistItem.id}`}
							type={showApiKey[myGenAssistIdx] ? "text" : "password"}
							size="default"
							title={t("setting.access-token")}
							state={errors[myGenAssistIdx]?.apiKey ? "error" : "default"}
							note={errors[myGenAssistIdx]?.apiKey ?? undefined}
							placeholder={t("setting.sso-token-placeholder")}
							backIcon={showApiKey[myGenAssistIdx] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
							onBackIconClick={() =>
								setShowApiKey((arr) => arr.map((v, i) => (i === myGenAssistIdx ? !v : v)))
							}
							value={myGenAssistForm.apiKey}
							onChange={(e) => {
								const v = e.target.value;
								setForm((f) =>
									f.map((fi, i) =>
										i === myGenAssistIdx ? { ...fi, apiKey: v } : fi
									)
								);
								setErrors((errs) =>
									errs.map((er, i) =>
										i === myGenAssistIdx ? { ...er, apiKey: "" } : er
									)
								);
							}}
						/>

						{/* API Endpoint */}
						<div className="relative">
							<Input
								id={`apiHost-${myGenAssistItem.id}`}
								size="default"
								title={t("setting.api-endpoint")}
								state={errors[myGenAssistIdx]?.apiHost ? "error" : "default"}
								note={errors[myGenAssistIdx]?.apiHost ?? undefined}
								placeholder="https://dev.chat.int.bayer.com/api/v2"
								value={myGenAssistForm.apiHost}
								disabled
								className="!bg-surface-tertiary !cursor-default"
							/>
							<div className="absolute right-3 top-[38px] flex items-center">
								<Lock className="w-3.5 h-3.5 text-text-label/40" />
							</div>
						</div>

						{/* Model */}
						<div className="relative">
							<Input
								id={`modelType-${myGenAssistItem.id}`}
								size="default"
								title={t("setting.model")}
								state={errors[myGenAssistIdx]?.model_type ? "error" : "default"}
								note={errors[myGenAssistIdx]?.model_type ?? undefined}
								placeholder="claude-sonnet-4.5"
								value={myGenAssistForm.model_type}
								disabled
								className="!bg-surface-tertiary !cursor-default"
							/>
							<div className="absolute right-3 top-[38px] flex items-center">
								<Lock className="w-3.5 h-3.5 text-text-label/40" />
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex justify-end px-6 py-4 gap-2 border-t border-border-secondary">
						<Button variant="ghost" size="sm" className="!text-text-label" onClick={() => handleDelete(myGenAssistIdx)}>{t("setting.reset")}</Button>
						<Button
							variant="primary"
							size="sm"
							onClick={() => handleVerify(myGenAssistIdx)}
							disabled={loading === myGenAssistIdx}
						>
							<span className="text-text-inverse-primary">
								{loading === myGenAssistIdx ? t("setting.verifying") : t("setting.verify-connection")}
							</span>
						</Button>
					</div>
				</div>
			)}
			{/* Local Model */}
			<div className="mt-2 bg-surface-secondary rounded-2xl flex flex-col gap-4">
				<div className="flex items-center justify-between mb-2 px-6 pt-4">
					<div className="font-bold text-body-lg text-text-heading">{t("setting.local-model")}</div>
					{localPrefer ? (
						<Button
							variant="success"
							size="sm"
							className="focus-none"
							disabled={!localEndpoint}
							onClick={() => handleLocalSwitch(false)}
						>
							Default
							<Check />
						</Button>
					) : (
						<Button
							variant="ghost"
							size="sm"
							disabled={!localEndpoint}
							onClick={() => handleLocalSwitch(true)}
							className={localEndpoint ? "!text-text-success" : ""}
						>
							{!localEndpoint ? "Not Configured" : "Set as Default"}
						</Button>
					)}
				</div>
				<div className="flex flex-col gap-4 px-6">

					<Select
						value={localPlatform}
						onValueChange={(v) => {
							console.log(v);
							setLocalPlatform(v);
						}}
						disabled={!localEnabled}
					>
						<SelectTrigger size="default" title={t("setting.model-platform")} state={localInputError ? "error" : undefined} note={localError ?? undefined}>
							<SelectValue placeholder="Select platform" />
						</SelectTrigger>
						<SelectContent className="bg-white-100%">
							<SelectItem value="ollama">Ollama</SelectItem>
							<SelectItem value="vllm">vLLM</SelectItem>
							<SelectItem value="sglang">SGLang</SelectItem>
							<SelectItem value="lmstudio">LMStudio</SelectItem>
						</SelectContent>
					</Select>

					<Input
						size="default"
						title={t("setting.model-endpoint-url")}
						state={localInputError ? "error" : "default"}
						value={localEndpoint}
						onChange={(e) => {
							setLocalEndpoint(e.target.value);
							setLocalInputError(false);
							setLocalError(null);
						}}
						disabled={!localEnabled}
						placeholder="http://localhost:11434/v1"
						note={localError ?? undefined}
					/>
					<Input
						size="default"
						title={t("setting.model-type")}
						state={localInputError ? "error" : "default"}
						placeholder={t("setting.enter-your-local-model-type")}
						value={localType}
						onChange={(e) => setLocalType(e.target.value)}
						disabled={!localEnabled}
					/>
				</div>
				<div className="flex justify-end mt-2 px-6 py-4 gap-2 border-b-0 border-x-0 border-solid border-border-secondary">
					<Button variant="ghost" size="sm" className="!text-text-label" onClick={handleLocalReset}>{t("setting.reset")}</Button>
					<Button
						onClick={handleLocalVerify}
						disabled={!localEnabled || localVerifying}
						variant="primary"
						size="sm"
					>
						<span className="text-text-inverse-primary">
							{localVerifying ? "Configuring..." : "Save"}
						</span>
					</Button>
				</div>
			</div>
		</div>
	);
}
