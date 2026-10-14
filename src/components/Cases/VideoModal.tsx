import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react'
import { DISK_FOLDER } from './caseData'
import { createPortal } from 'react-dom'
import './VideoModal.css'
import { asset } from '../../lib/asset'

const API = 'https://cloud-api.yandex.net/v1/disk/public/resources/download'
const cache = new Map<string, string>()

// Public Yandex Disk files have no stable direct URL: ask the API for a fresh one when the video is opened.
async function resolveVideo(file: string, signal: AbortSignal, fresh = false): Promise<string> {
  const hit = fresh ? undefined : cache.get(file)
  if (hit) return hit
  const url = new URL(API)
  url.searchParams.set('public_key', DISK_FOLDER)
  url.searchParams.set('path', `/${file}`)
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Яндекс.Диск ответил ${res.status}`)
  const { href } = (await res.json()) as { href: string }
  cache.set(file, href)
  return href
}

/** What the player needs: the file in the public Disk folder, a poster and the caption. Cases and the showcase cards both fit. */
export interface VideoItem {
  video: { file: string }
  /** a file in /assets/cases, or an absolute path starting with "/" */
  poster: string
  person: string
  summary: string
}

interface Props {
  item: VideoItem
  closing: boolean
  onClose: () => void
}

export function VideoModal({ item, closing, onClose }: Props) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [reason, setReason] = useState('')
  const retries = useRef(0)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const load = useCallback(
    (fresh: boolean, signal: AbortSignal) => {
      resolveVideo(item.video.file, signal, fresh)
        .then(setSrc)
        .catch((e: Error) => {
          if (e.name === 'AbortError') return
          setReason(e.message)
          setFailed(true)
        })
    },
    [item],
  )

  useEffect(() => {
    const ctrl = new AbortController()
    retries.current = 0
    setSrc(null)
    setFailed(false)
    setReason('')
    load(false, ctrl.signal)
    return () => ctrl.abort()
  }, [item, load])

  // Disk links are short-lived and sometimes refused on the first try: ask for a fresh one twice before giving up.
  const onVideoError = (e: SyntheticEvent<HTMLVideoElement>) => {
    const code = e.currentTarget.error?.code
    if (retries.current < 2) {
      retries.current += 1
      setSrc(null)
      window.setTimeout(() => load(true, new AbortController().signal), 500 * retries.current)
      return
    }
    setReason(
      code === 4 ? 'Яндекс.Диск не отдаёт этот файл (или браузер не поддерживает его формат)' : code === 2 ? 'ошибка сети при загрузке файла' : `код ошибки плеера ${code ?? '?'}`,
    )
    setFailed(true)
  }

  const fallback = `${DISK_FOLDER}/${encodeURIComponent(item.video.file)}`

  // Rendered into <body>: a pinned (transformed) section would otherwise size and clip a fixed overlay and keep it under the header.
  return createPortal(
    <div className={closing ? 'vm is-closing' : 'vm'} role="dialog" aria-modal="true" aria-label={item.person}>
      <button className="vm-backdrop" type="button" onClick={onClose} aria-label="Закрыть" tabIndex={-1} />
      <div className="vm-box">
        <div className="vm-screen">
          {src && !failed && (
            <video
              key={src}
              src={src}
              poster={item.poster.startsWith('/') ? item.poster : asset(`/assets/cases/${item.poster}`)}
              controls
              autoPlay
              playsInline
              preload="metadata"
              onError={onVideoError}
            />
          )}
          {!src && !failed && (
            <div className="vm-status">
              <span className="vm-spinner" />
              Загружаем видео…
            </div>
          )}
          {failed && (
            <div className="vm-status">
              Не удалось запустить видео здесь.
              {reason && <small>{reason}</small>}
              <a href={fallback} target="_blank" rel="noreferrer">
                Открыть на Яндекс.Диске
              </a>
            </div>
          )}
        </div>
        <p className="vm-caption">
          <b>{item.person}</b>
          <span>{item.summary}</span>
        </p>
      </div>
      <button className="vm-close" type="button" onClick={onClose} aria-label="Закрыть" ref={closeRef}>
        <img src={asset('/assets/faculties/close.svg')} alt="" />
      </button>
    </div>,
    document.body,
  )
}
