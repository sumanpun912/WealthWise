// Setup file specifically for API tests (node environment)
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill for Request/Response in node environment
if (typeof global.Request === 'undefined') {
  const { Request, Response, Headers } = require('undici')
  global.Request = Request
  global.Response = Response
  global.Headers = Headers
}

