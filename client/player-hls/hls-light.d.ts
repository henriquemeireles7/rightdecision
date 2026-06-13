/**
 * hls.js ships types only for its root entry — map the light build (same public API,
 * minus in-manifest subtitles/alt-audio/EME we never use) onto those declarations.
 */
declare module 'hls.js/dist/hls.light.mjs' {
  import Hls from 'hls.js'

  export default Hls
}
