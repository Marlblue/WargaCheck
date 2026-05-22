/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Client-side API service — all calls go through /api/* proxy.
 * The Gemini API key is NEVER exposed to the browser.
 */

const REQUEST_TIMEOUT_MS = 35_000;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function handleErrorResponse(res: Response): Promise<never> {
  const err = await res.json().catch(() => ({}));

  if (res.status === 429) {
    throw new Error(err.error || 'Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi.');
  }
  if (res.status === 504) {
    throw new Error(err.error || 'AI sedang sibuk. Coba lagi dalam beberapa detik.');
  }
  if (res.status === 400) {
    throw new Error(err.error || 'Data yang dikirim tidak valid.');
  }

  throw new Error(err.error || `Terjadi kesalahan (${res.status}). Coba lagi.`);
}

export async function sendMessage(
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
): Promise<string> {
  let res: Response;

  try {
    res = await fetchWithTimeout('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Koneksi timeout. Periksa internet kamu dan coba lagi.');
    }
    throw new Error('Gagal terhubung ke server. Periksa internet kamu.');
  }

  if (!res.ok) {
    await handleErrorResponse(res);
  }

  const data = await res.json();
  return data.text || '';
}

/**
 * Send a chat message with real SSE streaming.
 * Calls onChunk for each piece of text as it arrives from Gemini.
 * Returns the full assembled text.
 */
export async function sendMessageStream(
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
  onChunk: (text: string) => void,
): Promise<string> {
  let res: Response;

  try {
    res = await fetchWithTimeout('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    }, 60_000); // longer timeout for streaming
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Koneksi timeout. Periksa internet kamu dan coba lagi.');
    }
    throw new Error('Gagal terhubung ke server. Periksa internet kamu.');
  }

  if (!res.ok) {
    await handleErrorResponse(res);
  }

  // Read the SSE stream
  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error('Streaming tidak didukung di browser ini.');
  }

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();

      if (data === '[DONE]') {
        return fullText;
      }

      try {
        const parsed = JSON.parse(data);
        if (parsed.error) {
          throw new Error(parsed.error);
        }
        if (parsed.text) {
          fullText += parsed.text;
          onChunk(fullText);
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue; // skip malformed chunks
        throw e;
      }
    }
  }

  return fullText;
}

export async function checkBerkas(
  jenisLayanan: string,
  keperluan: string,
  statusPernikahan: string,
  kewarganegaraan: string,
): Promise<string> {
  let res: Response;

  try {
    res = await fetchWithTimeout('/api/check-berkas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jenisLayanan, keperluan, statusPernikahan, kewarganegaraan }),
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Koneksi timeout. Periksa internet kamu dan coba lagi.');
    }
    throw new Error('Gagal terhubung ke server. Periksa internet kamu.');
  }

  if (!res.ok) {
    await handleErrorResponse(res);
  }

  const data = await res.json();
  return data.text || '';
}

export async function scanDocument(
  file: File,
): Promise<string> {
  let res: Response;
  
  const formData = new FormData();
  formData.append('image', file);

  try {
    res = await fetchWithTimeout('/api/scan', {
      method: 'POST',
      body: formData,
    }, 50_000); // longer timeout for vision
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Analisis timeout. Coba foto yang lebih kecil atau lebih jelas.');
    }
    throw new Error('Gagal terhubung ke server. Periksa internet kamu.');
  }

  if (!res.ok) {
    await handleErrorResponse(res);
  }

  const data = await res.json();
  return data.text || '';
}
