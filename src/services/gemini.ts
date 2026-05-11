/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Client-side API service — all calls go through /api/* proxy.
 * The Gemini API key is NEVER exposed to the browser.
 */

const REQUEST_TIMEOUT_MS = 35_000; // slightly longer than server timeout

/**
 * Create a fetch request with a timeout.
 */
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

/**
 * Parse error response and throw with a user-friendly message.
 */
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
