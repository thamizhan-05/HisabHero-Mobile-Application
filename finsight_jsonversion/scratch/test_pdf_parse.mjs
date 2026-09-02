import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

console.log('Keys of pdf:', Object.keys(pdf));
console.log('PDFParse:', pdf.PDFParse);

// Create a dummy node Buffer
const buf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Length 0 >>\nstream\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
console.log('buf instanceof Buffer:', buf instanceof Buffer);
console.log('buf instanceof Uint8Array:', buf instanceof Uint8Array);

const uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
console.log('uint8 instanceof Buffer:', uint8 instanceof Buffer);
console.log('uint8 instanceof Uint8Array:', uint8 instanceof Uint8Array);

try {
  const p = new pdf.PDFParse(uint8);
  console.log('p options:', p.options);
  const t = await p.getText();
  console.log('t:', t);
} catch (e) {
  console.error('Error with new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength):', e);
}

try {
  const p2 = new pdf.PDFParse(buf);
  console.log('p2:', p2);
} catch (e) {
  console.error('Error with buf:', e.message);
}
