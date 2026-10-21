import * as THREE from 'three'

export function createMaskTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return texture
}

/** GPU texture storage cannot keep its original allocation after a canvas resize. */
export function resizeMaskTexture(texture: THREE.CanvasTexture, width: number, height: number) {
  const canvas = texture.image as HTMLCanvasElement
  if (canvas.width === width && canvas.height === height) return texture
  canvas.width = width
  canvas.height = height
  const replacement = createMaskTexture(canvas)
  texture.dispose()
  return replacement
}
