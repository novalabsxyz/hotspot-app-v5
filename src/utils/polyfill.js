import iconv from 'iconv-lite'
import encodings from 'iconv-lite/encodings'
import buffer from 'buffer'
import TextEncoder from './TextEncoder'
import TextDecoder from './TextDecoder'

global.Buffer = global.Buffer || buffer.Buffer

// Force load encodings
iconv.encodings = encodings

console.log(Object.getOwnPropertyDescriptor(global, 'TextDecoder'))

if (global.TextDecoder) {
  try {
    delete global.TextDecoder // Attempt to remove the existing TextDecoder
  } catch (error) {
    console.warn('Failed to delete existing TextDecoder:', error)
  }
}

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Force override global.TextDecoder
Object.defineProperty(global, 'TextDecoder', {
  value: global.TextDecoder,
  writable: false,
  configurable: false,
  enumerable: true,
})
