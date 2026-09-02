import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function testPdfLib() {
  const pdfParse = require('pdf-parse');
  console.log('Testing pdf-parse...');
  
  // Create a clean ArrayBuffer
  const text = 'Hello PDF';
  const buf = Buffer.from(text);
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; i++) {
    view[i] = buf[i];
  }
  console.log('Is buffer?', Buffer.isBuffer(view)); // false
  console.log('Is Uint8Array?', view instanceof Uint8Array); // true
}
testPdfLib();
