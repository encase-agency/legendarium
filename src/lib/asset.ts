/** Path of a file from /public, correct also when the site lives in a sub-folder (GitHub Pages: /legendarium/). */
export const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, '')
