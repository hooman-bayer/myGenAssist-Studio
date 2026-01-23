import { Provider } from "@/types";

export const INIT_PROVODERS: Provider[] = [
  {
    id: 'openai-compatible-model',
    name: 'OpenAI Compatible',
    apiKey: '',
    apiHost: 'https://dev.chat.int.bayer.com/api/v2',
    description: "OpenAI-compatible API endpoint configuration.",
    hostPlaceHolder: "e.g. https://api.x.ai/v1",
    is_valid: false,
    model_type: "claude-sonnet-4.5"
  }
]
