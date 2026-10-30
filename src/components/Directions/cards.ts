// Figma: card 1 = 526:2504, cards 2-12 = frames 188:661 ... 232:1819, card 13 = 188:736.
// Offsets are px inside the 349x427 card (the design's text `top` minus the card `top`).

export interface Overlay {
  /** CSS background of the layer (colour or rgba). */
  color: string
  /** Blur radius in design px, 0 for a flat tint. */
  blur: number
  /** Box in design px relative to the card; omit for a full-card tint. */
  box?: { left?: number; top?: number; bottom?: number; width: number; height: number; centered?: boolean }
}

export interface DirectionCard {
  id: string
  image: string
  /** Crop of the photo as in Figma (percent of the card); omitted = object-fit: cover. */
  crop?: { h: number; left: number; top: number }
  base?: string
  overlays?: Overlay[]
  dark?: boolean
  /** the bottom gradient of the list view (Figma 642:3463): clear down to 56%, this colour from 84% */
  fade?: string
  /** kept for reference: the text is now anchored to the bottom of every card, like on the first one */
  textTop: number
  title: string[]
  body: string[]
}

const TINT: Overlay = { color: 'rgba(0,0,0,0.2)', blur: 0 }
const BOTTOM_FADE: Overlay = {
  color: 'rgba(0,0,0,0.66)',
  blur: 29.3,
  box: { bottom: 0, width: 541, height: 154, centered: true },
}
/** Full-card gradient of the new frames (629:3041 ...): clear down to 56%, the given colour from 84% down. */
const fadeTo = (color: string): Overlay => ({
  color: `linear-gradient(to bottom, rgba(102,102,102,0) 56.206%, ${color} 84.426%)`,
  blur: 0,
})

// Photos and overlays follow the desktop frames "Анимация" (Figma 629:3040). The text is anchored to the bottom of
// every card (see .dr-text), the photos are already cropped to the card.
export const DIRECTION_CARDS: DirectionCard[] = [
  {
    id: 'c01',
    image: 'c01.jpg',
    base: '#ffffff',
    dark: true,
    textTop: 288,
    title: ['Искусственный интеллект и контент'],
    body: ['Картинки, видео и тексты с нейросетями для бизнеса, блогеров и своего блога.'],
  },
  {
    id: 'c02',
    image: 'c02.jpg',
    textTop: 314,
    title: ['ИИ-автоматизация'],
    body: ['Боты и автоматизации для задач бизнеса без классического программирования.'],
  },
  {
    id: 'c03',
    fade: 'linear-gradient(to bottom, rgba(102,102,102,0) 56.206%, #0d1b2e 84.426%)',
    image: 'c03.jpg',
    base: '#000000',
    overlays: [fadeTo('#0d1b2e')],
    textTop: 314,
    title: ['Графический дизайн'],
    body: ['Креативы, обложки, презентации', 'и оформление цифровых продуктов.'],
  },
  {
    id: 'c04',
    fade: 'linear-gradient(to bottom, rgba(102,102,102,0) 56.206%, rgba(65,59,53,0.85) 84.426%)',
    image: 'c04.jpg',
    overlays: [fadeTo('rgba(65,59,53,0.85)')],
    textTop: 314,
    title: ['Трафик и реклама'],
    body: ['Поиск аудитории, запуск кампаний', 'и работа с результатами.'],
  },
  {
    id: 'c05',
    fade: 'linear-gradient(to bottom, rgba(102,102,102,0) 56.206%, rgba(18,17,16,0.85) 84.426%)',
    image: 'c05.jpg',
    textTop: 314,
    title: ['Копирайтинг'],
    body: ['Посты, лендинги, рассылки, сценарии', 'и коммерческие предложения.'],
  },
  {
    id: 'c06',
    fade: 'linear-gradient(to bottom, rgba(102,102,102,0) 56.206%, #241913 84.426%)',
    image: 'c06.jpg',
    overlays: [fadeTo('rgba(88,66,55,0.84)')],
    textTop: 289,
    title: ['Мобильная съёмка', 'и монтаж'],
    body: ['Короткие видео для брендов, экспертов и собственных каналов.'],
  },
  {
    id: 'c07',
    fade: 'linear-gradient(to bottom, rgba(102,102,102,0) 56.206%, #000000 84.426%)',
    image: 'c07.jpg',
    overlays: [fadeTo('#101821')],
    textTop: 314,
    title: ['YouTube и ВКонтакте'],
    body: ['Запуск, упаковка и ведение каналов, работа со своим и чужим контентом.'],
  },
  {
    id: 'c08',
    fade: 'linear-gradient(to bottom, rgba(102,102,102,0) 56.206%, #000000 84.426%)',
    image: 'c08.jpg',
    overlays: [BOTTOM_FADE],
    textTop: 314,
    title: ['Онлайн-бизнес'],
    body: ['Продукт, упаковка, трафик, продажи, процессы и команда.'],
  },
  {
    id: 'c09',
    fade: 'linear-gradient(to bottom, rgba(102,102,102,0) 56.206%, #000000 84.426%)',
    image: 'c09.jpg',
    overlays: [BOTTOM_FADE],
    textTop: 263,
    title: ['Криптовалюты', 'и трейдинг'],
    body: ['Разберись, как устроен крипторынок. Научись оценивать риск и принимать решения по понятной стратегии. Без хаотичных сделок и догадок'],
  },
  {
    id: 'c10',
    fade: 'linear-gradient(to bottom, rgba(102,102,102,0) 56.206%, #000000 84.426%)',
    image: 'c10.jpg',
    textTop: 306,
    title: ['Партнёрский бизнес'],
    body: ['Поиск проектов и партнёров, переговоры, условия сотрудничества, сопровождение сделки.'],
  },
  {
    id: 'c11',
    fade: 'linear-gradient(to bottom, rgba(102,102,102,0) 56.206%, #000000 84.426%)',
    image: 'c11.jpg',
    overlays: [{ ...BOTTOM_FADE, box: { bottom: 12, width: 541, height: 154, centered: true } }],
    textTop: 296,
    title: ['Партнёрские запуски'],
    body: ['Подготовка запуска вместе с экспертом: продукт, упаковка, трафик, продажи, аналитика.'],
  },
  {
    id: 'c12',
    fade: 'linear-gradient(to bottom, rgba(102,102,102,0) 56.206%, #000000 84.426%)',
    image: 'c12.jpg',
    overlays: [TINT, BOTTOM_FADE],
    textTop: 280,
    title: ['Мышление и психология успеха'],
    body: ['Уроки Андрея по правильному мышлению, достижению целей', 'и позиционированию в жизни.'],
  },
]
