import fs from 'fs';
import path from 'path';

function findEndpoints(dir) {
  const files = fs.readdirSync(dir, { recursive: true });
  const endpoints = new Set();
  
  for (const f of files) {
    const fullPath = path.join(dir, f);
    if (!fs.statSync(fullPath).isFile() || (!f.endsWith('.ts') && !f.endsWith('.tsx') && !f.endsWith('.js'))) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    const matches = content.matchAll(/(apiClient\.(get|post|put|delete|patch)|fetch(?:WithTimeout)?)\s*\(\s*[`"']([^`"'$]+)[`"']/g);
    for (const m of matches) {
      endpoints.add(`${m[1]} -> ${m[3]}`);
    }
    const templateMatches = content.matchAll(/(apiClient\.(get|post|put|delete|patch)|fetch(?:WithTimeout)?)\s*\(\s*`([^`]+)`/g);
    for (const m of templateMatches) {
      endpoints.add(`${m[1]} -> \`${m[3]}\``);
    }
  }
  return Array.from(endpoints).sort();
}

console.log('Mobile Endpoints Called:');
console.log(findEndpoints(path.resolve('../mobile/src')));
