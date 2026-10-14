/**
 * Text broken into explicit lines. A space is kept before every <br> so the
 * words stay apart when a layout hides the breaks and lets the text wrap.
 */
export function Lines({ lines, className }: { lines: readonly string[]; className?: string }) {
  const items = (
    <>
      {lines.map((line, i) => (
        <span key={line}>
          {line}
          {i < lines.length - 1 && (
            <>
              {' '}
              <br />
            </>
          )}
        </span>
      ))}
    </>
  )
  return className ? <span className={className}>{items}</span> : items
}
