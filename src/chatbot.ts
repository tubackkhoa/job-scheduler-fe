const { VITE_API_CHAT_URL = 'http://localhost:8001' } = import.meta.env;

type StreamOptions<T> = {
  path: string;
  payload: T;
  onToken: (text: string) => void;
};

export async function streamChat<T>({
  path,
  payload,
  onToken
}: StreamOptions<T>): Promise<string> {
  const res = await fetch(`${VITE_API_CHAT_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.body) {
    throw new Error('No response body');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    text += chunk;
    onToken(text);
  }

  return text;
}
