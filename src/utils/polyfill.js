import iconv from 'iconv-lite'
import encodings from 'iconv-lite/encodings'
import buffer from 'buffer'
import TextEncoder from './TextEncoder'
import TextDecoder from './TextDecoder'

global.Buffer = global.Buffer || buffer.Buffer

// Force load encodings
iconv.encodings = encodings

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Define global.TextDecoder (always do this)
Object.defineProperty(global, 'TextDecoder', {
  value: global.TextDecoder,
  writable: false,
  configurable: false,
  enumerable: true,
})

console.log('Polyfill applied.')
