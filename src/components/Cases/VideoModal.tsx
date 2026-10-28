import { useEffect, useRef, useState, type SyntheticEvent } from 'react'
import { DISK_FOLDER } from './caseData'
import { createPortal } from 'react-dom'
import './VideoModal.css'
import { asset } from '../../lib/asset'
import { siteConfig } from '../../lib/siteConfig'
import { useDialogLifecycle } from '../../lib/useDialogLifecycle'
import { preparedVideos } from './preparedVideos'
import { kinescopeEmbedUrl, kinescopeVideos } from './kinescopeVideos'

const API = 'https://cloud-api.yandex.net/v1/disk/public/resources/download'
const cache = new Map<string, string>()

// Public Yandex Disk files have no stable direct URL: ask the API for a fresh one when the video is opened.
async function resolveVideo(file: string, signal: AbortSignal, fresh = false): Promise<string> {
  if (siteConfig.mediaBaseUrl) return `${siteConfig.mediaBaseUrl.replace(/\/$/, '')}/${encodeURIComponent(preparedVideos[file] ?? file)}`
  if (preparedVideos[file]) return asset(`/media/videos/${preparedVideos[file]}`)
  const hit = fresh ? undefined : cache.get(file)
  if (hit) return hit
  const url = new URL(API)
  url.searchParams.set('public_key', DISK_FOLDER)
  url.searchParams.set('path', `/${file}`)
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Яндекс.Диск ответил ${res.status}`)
  const { href } = (await res.json()) as { href?: string }
  if (!href || !href.startsWith('https://')) throw new Error('Сервис видео вернул некорректную ссылку')
  cache.set(file, href)
  return href
}

/** What the player needs: the file in the public Disk folder, a poster and the caption. Cases and the showcase cards both fit. */
export interface VideoItem {
  /** a Kinescope media id, or a file in the public Disk folder / the prepared local videos */
  video: { file?: string; id?: string }
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
  const file = item.video.file ?? ''
  const kinescope = item.video.id ? { id: item.video.id } : kinescopeVideos[file]
  const hosted = Boolean(kinescope)
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [reason, setReason] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [frameReady, setFrameReady] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const readyTimer = useRef<number>(0)
  useDialogLifecycle(dialogRef, onClose, closeRef)

  useEffect(() => {
    if (closing || hosted) return
    const ctrl = new AbortController()
    setSrc(null)
    setFailed(false)
    setReason('')
    const deadline = window.setTimeout(() => {
      setReason('Сервис видео не ответил вовремя. Попробуйте открыть исходный файл.')
      setFailed(true)
      ctrl.abort()
    }, 15_000)
    // Both the delayed retry and the fetch belong to this opening of the dialog.
    const retry = window.setTimeout(() => {
      resolveVideo(file, ctrl.signal, attempt > 0)
        .then(url => { if (!ctrl.signal.aborted) setSrc(url) })
        .catch((error: Error) => {
          if (ctrl.signal.aborted) return
          setReason(error.message)
          setFailed(true)
        })
        .finally(() => window.clearTimeout(deadline))
    }, attempt * 500)
    return () => {
      ctrl.abort()
      window.clearTimeout(retry)
      window.clearTimeout(deadline)
    }
  }, [file, closing, attempt, hosted])

  useEffect(() => {
    if (!src || closing) return
    readyTimer.current = window.setTimeout(() => {
      setReason('Видео не загрузилось вовремя. Проверьте соединение или откройте исходный файл.')
      setFailed(true)
    }, 25_000)
    return () => window.clearTimeout(readyTimer.current)
  }, [src, closing])

  const onVideoError = (event: SyntheticEvent<HTMLVideoElement>) => {
    window.clearTimeout(readyTimer.current)
    if (closing || failed) return
    const code = event.currentTarget.error?.code
    // Refresh expiring Disk links. Hosted files have a stable URL and should report errors directly.
    if (!siteConfig.mediaBaseUrl && attempt < 2) {
      setSrc(null)
      setAttempt(value => value + 1)
      return
    }
    setReason(code === 4 ? 'Файл недоступен или его формат не поддерживается браузером' : 'Ошибка сети при загрузке видео')
    setFailed(true)
  }

  const fallback = `${DISK_FOLDER}/${encodeURIComponent(file)}`

  // Rendered into <body>: a pinned (transformed) section would otherwise size and clip a fixed overlay and keep it under the header.
  return createPortal(
    <div className={closing ? 'vm is-closing' : 'vm'} role="dialog" aria-modal="true" aria-label={item.person} ref={dialogRef} tabIndex={-1}>
      <button className="vm-backdrop" type="button" onClick={onClose} aria-label="Закрыть" tabIndex={-1} />
      <div className="vm-box">
        <div className="vm-screen">
          {kinescope && !closing && <iframe
            src={kinescopeEmbedUrl(kinescope.id)}
            title={`Видео: ${item.person}`}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            onLoad={() => setFrameReady(true)}
            style={{ opacity: frameReady ? 1 : 0 }}
          />}
          {kinescope && !frameReady && !closing && (
            <div className="vm-status" role="status">
              <span className="vm-spinner" />
              Загружаем видео…
            </div>
          )}
          {!kinescope && src && !failed && !closing && (
            <video
              key={src}
              src={src}
              poster={item.poster.startsWith('/') ? item.poster : asset(`/assets/cases/${item.poster}`)}
              controls
              autoPlay
              playsInline
              preload="metadata"
              onError={onVideoError}
              onLoadedMetadata={() => window.clearTimeout(readyTimer.current)}
            />
          )}
          {!kinescope && !src && !failed && (
            <div className="vm-status" role="status">
              <span className="vm-spinner" />
              Загружаем видео…
            </div>
          )}
          {!kinescope && failed && (
            <div className="vm-status" role="status">
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
