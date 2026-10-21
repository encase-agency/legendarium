/** A successful HTTP response is required before showing the thank-you screen. */
export async function sendLead(endpoint: string, name: string, telegram: string, signal: AbortSignal) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, telegram, source: 'ask-form' }),
    signal,
  })
  if (!response.ok) throw new Error(`lead ${response.status}`)
  signal.throwIfAborted()
}
