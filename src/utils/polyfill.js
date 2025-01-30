import { Platform } from 'react-native';
import iconv from 'iconv-lite';
import encodings from 'iconv-lite/encodings';
import buffer from 'buffer';

global.Buffer = global.Buffer || buffer.Buffer;

// Force load encodings
iconv.encodings = encodings;

console.log(Object.getOwnPropertyDescriptor(global, 'TextDecoder'));

if (global.TextDecoder) {
  try {
    delete global.TextDecoder; // Attempt to remove the existing TextDecoder
  } catch (error) {
    console.warn('Failed to delete existing TextDecoder:', error);
  }
}

global.TextEncoder = class {
  constructor(encoding = 'utf-8') {
    this.encoding = encoding;
  }

  encode(str) {
    if (!iconv.encodingExists(this.encoding)) {
      throw new RangeError(`Unknown encoding: ${this.encoding}`);
    }
    return Buffer.from(iconv.encode(str, this.encoding));
  }
};

global.TextDecoder = class {
  constructor(encoding = 'utf-8') {
    this.encoding = encoding;
  }

  decode(buffer) {
    if (!iconv.encodingExists(this.encoding)) {
      throw new RangeError(`Unknown encoding: ${this.encoding}`);
    }
    return iconv.decode(Buffer.from(buffer), this.encoding);
  }
};

// Force override global.TextDecoder
Object.defineProperty(global, 'TextDecoder', {
  value: global.TextDecoder,
  writable: false,
  configurable: false,
  enumerable: true,
});

// console.log('Polyfilled TextDecoder successfully applied:', global.TextDecoder);
