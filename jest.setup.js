// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfills for Next.js API routes testing
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill for Request/Response if not available (only in node environment)
if (typeof global.Request === 'undefined' && typeof ReadableStream !== 'undefined') {
  try {
    const { Request, Response, Headers } = require('undici')
    global.Request = Request
    global.Response = Response
    global.Headers = Headers
  } catch (e) {
    // undici not available or ReadableStream not available, skip
  }
}

