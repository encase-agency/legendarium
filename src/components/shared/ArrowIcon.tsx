import './ArrowIcon.css'

// Figma nests the arrow in a 180deg box and a -45deg box; the net effect is a 135deg turn.
export function ArrowIcon({ src }: { src: string }) {
  return (
    <span className="arrow-icon">
      <span className="arrow-icon-pos">
        <span className="arrow-icon-rot">
          <img src={src} alt="" />
        </span>
      </span>
    </span>
  )
}
