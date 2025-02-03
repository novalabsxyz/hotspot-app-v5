import iconv from 'iconv-lite'

export default class TextEncoder {
  constructor(encoding = 'utf-8') {
    this.encoding = encoding
  }

  encode(str) {
    if (!iconv.encodingExists(this.encoding)) {
      throw new RangeError(`Unknown encoding: ${this.encoding}`)
    }
    return Buffer.from(iconv.encode(str, this.encoding))
  }
}
