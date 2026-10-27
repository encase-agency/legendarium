interface PhotoSlot {
  left: number
  documentTop: number
  width: number
  height: number
}

export function founderPhotoTransform(
  progress: number,
  slot: PhotoSlot,
  viewport: { width: number; height: number; scrollY: number },
) {
  const eased = 1 - (1 - progress) ** 3
  const scale = (150 + (slot.width - 150) * eased) / slot.width
  const centerX = viewport.width / 2 + (slot.left + slot.width / 2 - viewport.width / 2) * eased
  const centerY = viewport.height / 2 + (slot.documentTop - viewport.scrollY + slot.height / 2 - viewport.height / 2) * eased
  return { x: centerX - slot.width * scale / 2, y: centerY - slot.height * scale / 2, scale }
}
