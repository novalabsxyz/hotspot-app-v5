import iconv from 'iconv-lite'
import encodings from 'iconv-lite/encodings'
import buffer from 'buffer'
import TextEncoder from './TextEncoder'
import TextDecoder from './TextDecoder'

global.Buffer = global.Buffer || buffer.Buffer

// Force load encodings
iconv.encodings = encodings

console.log(Object.getOwnPropertyDescriptor(global, 'TextDecoder'))

if (typeof global.TextDecoder === 'undefined') {
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder

  // Define global.TextDecoder
  Object.defineProperty(global, 'TextDecoder', {
    value: global.TextDecoder,
    writable: false,
    configurable: false,
    enumerable: true,
  })
} else {
  console.warn(
    'TextDecoder is already defined and not configurable. Skipping override.',
  )
}
