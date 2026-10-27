/** Accept resize messages only from the mounted GetCourse frame and its widget instance. */
export function getWidgetHeight(event: { origin: string; source: unknown; data: unknown }, source: unknown, key: string): number | undefined {
  if (!source || event.origin !== 'https://legendaschool.ru' || event.source !== source) return
  const data = event.data
  if (!data || typeof data !== 'object' || !('uniqName' in data) || data.uniqName !== key || !('height' in data)) return
  if (typeof data.height !== 'number' && typeof data.height !== 'string') return
  const height = Number(data.height)
  if (Number.isFinite(height) && height > 0 && height <= 20000) return height
}
