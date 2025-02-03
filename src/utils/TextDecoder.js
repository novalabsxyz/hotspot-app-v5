import iconv from 'iconv-lite'

export default class TextDecoder {
  constructor(encoding = 'utf-8') {
    this.encoding = encoding
  }

  decode(inputBuffer) {
    if (!iconv.encodingExists(this.encoding)) {
      throw new RangeError(`Unknown encoding: ${this.encoding}`)
    }
    return iconv.decode(Buffer.from(inputBuffer), this.encoding)
  }
}
