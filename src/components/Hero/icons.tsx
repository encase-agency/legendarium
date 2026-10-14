import { asset } from '../../lib/asset'
export function MenuIcon() {
  return <img src={asset('/assets/hero/figma-burger.svg')} alt="" width={13} height={10} />
}

export function ArrowUpRightIcon() {
  return <img src={asset('/assets/hero/figma-arrow-up-right.svg')} alt="" width={16} height={18} />
}

export function TargetIcon() {
  return <img src={asset('/assets/hero/info-target-tile.png')} alt="" className="hero-info-icon-img" />
}

export function CertifiedBadge({ className }: { className?: string }) {
  return <img src={asset('/assets/hero/figma-cert-badge.png')} alt="Проверено GetCourse" className={className} />
}
