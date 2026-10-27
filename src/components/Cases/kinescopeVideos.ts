// Confirmed by the owner's October 27 list and public Kinescope media responses.
// Do not infer identities for the unnamed trading reviews or replace the montage case with trader Egor.
export const kinescopeVideos: Record<string, { id: string; shareUrl: string }> = {
  'Алексей 4200$, трейдинг, кейс.mp4': {
    id: '56a22d6f-2ba6-47ec-9b27-349d47e65e6f',
    shareUrl: 'https://kinescope.io/sh/xohiAW6c6GokPmMyZBZLxQ/v/56a22d6f-2ba6-47ec-9b27-349d47e65e6f',
  },
  '1500$ за 3 дня, трейдинг, полный кейс.mp4': {
    id: 'e996ad3a-83b8-4c9e-a7f6-076259ac3f4b',
    shareUrl: 'https://kinescope.io/sh/xohiAW6c6GokPmMyZBZLxQ/v/e996ad3a-83b8-4c9e-a7f6-076259ac3f4b',
  },
  'Андрей 85% к депо, трейдинг, кейс.mp4': {
    id: 'c6518b6e-d367-4778-b760-b09f6713fb7c',
    shareUrl: 'https://kinescope.io/sh/xohiAW6c6GokPmMyZBZLxQ/v/c6518b6e-d367-4778-b760-b09f6713fb7c',
  },
  'Денис 350к, партнерка, тизер.mp4': {
    id: '9eeb72e9-4f6f-4c32-b854-eed003d6d2eb',
    shareUrl: 'https://kinescope.io/sh/xohiAW6c6GokPmMyZBZLxQ/v/9eeb72e9-4f6f-4c32-b854-eed003d6d2eb',
  },
}

export function kinescopeEmbedUrl(id: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('Invalid Kinescope media ID')
  // Player and adaptive streaming load only after opening the modal, video bytes after pressing Play.
  return `https://kinescope.io/embed/${id}?preload=0`
}
