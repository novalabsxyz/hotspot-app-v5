import iconv from 'iconv-lite'
import encodings from 'iconv-lite/encodings'
import buffer from 'buffer'
import TextEncoder from './TextEncoder'
import TextDecoder from './TextDecoder'

global.Buffer = global.Buffer || buffer.Buffer

// Force-load encodings
iconv.encodings = encodings

console.log(
  'Checking global.TextDecoder properties:',
  Object.getOwnPropertyDescriptor(global, 'TextDecoder'),
)
console.log('TextDecoder constructor:', global.TextDecoder)

if (typeof global.TextDecoder !== 'undefined') {
  try {
    delete global.TextDecoder // Try to remove it if it's configurable
    console.log('Deleted existing TextDecoder successfully.')
  } catch (error) {
    console.warn('Failed to delete existing TextDecoder:', error)
  }
}

// Now attempt to override it only if it was successfully deleted or not defined at all
if (typeof global.TextDecoder === 'undefined') {
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder

  // Prevent future overwrites
  Object.defineProperty(global, 'TextDecoder', {
    value: global.TextDecoder,
    writable: false,
    configurable: false,
    enumerable: true,
  })

  console.log('Polyfilled TextDecoder successfully applied.')
} else {
  console.warn(
    'global.TextDecoder is already defined and non-configurable, skipping polyfill.',
  )
}
