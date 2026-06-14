export interface ChatRequest {
  model: string;
  messages: unknown[];
  maxTokens: number;
  system?: string;
}

export interface ChatResponse {
  text: string;
  model: string;
}

export interface AIProvider {
  chat(request: ChatRequest): Promise<ChatResponse>;
}
