/**
 * OpenRouter key verification. Before storing a user's key we confirm it is
 * live against OpenRouter's `/key` endpoint (returns the key's metadata on a
 * valid token, 401 on an invalid one), so a bad key is rejected at save time
 * rather than surfacing later as a failed generation job.
 */
const KEY_ENDPOINT = "https://openrouter.ai/api/v1/key";

/** True when OpenRouter accepts the key. Network/5xx errors are treated as not-valid. */
export async function verifyOpenRouterKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(KEY_ENDPOINT, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}
