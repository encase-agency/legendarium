import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { CASES } from './caseData'
import { CaseRow } from './CaseRow'
import { ArrowIcon } from '../shared/ArrowIcon'
import './Cases.css'
import { asset } from '../../lib/asset'

const VideoModal = lazy(() => import('./VideoModal').then(module => ({ default: module.VideoModal })))
const ReviewsModal = lazy(() => import('./ReviewsModal').then(module => ({ default: module.ReviewsModal })))
const reviewData = () => import('./reviewData').then(module => module.REVIEWS)

type Open = { list: 'cases' | 'reviews'; index: number }
type Reviews = Awaited<ReturnType<typeof reviewData>>

// Figma 574:2116. A click on a case (or its play button) opens the video player; "Смотреть больше" opens the window
// with more reviews (Figma 659:4246), whose rows open the player on top of it.
export function Cases() {
  const [open, setOpen] = useState<Open | null>(null)
  const [closing, setClosing] = useState(false)
  const [reviews, setReviews] = useState(false)
  const [reviewsClosing, setReviewsClosing] = useState(false)
  const [reviewList, setReviewList] = useState<Reviews>([])
  const timer = useRef<number>(0)
  const reviewsTimer = useRef<number>(0)

  // The reviews are only needed behind "Смотреть больше": load them on the first intent.
  const loadReviews = useCallback(() => {
    void reviewData().then(setReviewList)
  }, [])

  const openVideo = (o: Open) => {
    window.clearTimeout(timer.current)
    setClosing(false)
    setOpen(o)
  }

  const closeVideo = useCallback(() => {
    setClosing(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setOpen(null)
      setClosing(false)
    }, 250)
  }, [])

  const openReviews = () => {
    loadReviews()
    window.clearTimeout(reviewsTimer.current)
    setReviewsClosing(false)
    setReviews(true)
  }

  const closeReviews = useCallback(() => {
    setReviewsClosing(true)
    window.clearTimeout(reviewsTimer.current)
    reviewsTimer.current = window.setTimeout(() => {
      setReviews(false)
      setReviewsClosing(false)
    }, 250)
  }, [])

  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      window.clearTimeout(reviewsTimer.current)
    },
    [],
  )

  const video = open && (open.list === 'cases' ? CASES : reviewList)[open.index]

  return (
    <section className="cases" id="cases">
      <h2 className="cs-heading">
        Это результаты конкретных{' '}
        <br />
        участников сообщества
      </h2>
      <p className="cs-sub">Всё возможно, если выполнять рекомендации наставников.</p>

      <div className="cs-list">
        {CASES.map((c, i) => (
          <CaseRow item={c} key={c.id} onOpen={() => openVideo({ list: 'cases', index: i })} />
        ))}
      </div>

      <button className="cs-all" type="button" onClick={openReviews} onPointerEnter={loadReviews} aria-haspopup="dialog">
        Смотреть больше
        <span className="cs-all-icon">
          <ArrowIcon src={asset('/assets/faculties/arrow.svg')} />
        </span>
      </button>

      {reviews && reviewList.length > 0 && (
        <Suspense fallback={null}>
          <ReviewsModal
            closing={reviewsClosing}
            reviews={reviewList}
            onClose={closeReviews}
            onOpenVideo={(index) => openVideo({ list: 'reviews', index })}
          />
        </Suspense>
      )}
      {video && <Suspense fallback={null}><VideoModal item={video} closing={closing} onClose={closeVideo} /></Suspense>}
    </section>
  )
}
