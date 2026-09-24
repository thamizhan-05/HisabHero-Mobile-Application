const fs = require('fs');
const path = 'finsight_jsonversion/vercel.json';
if (fs.existsSync(path)) {
  const clean = {
    name: 'hisabhero',
    version: 2,
    rewrites: [{ source: '/(.*)', destination: { type: 'service', service: 'web' } }],
    services: { web: { root: '.', entrypoint: 'backend/server.js' } }
  };
  fs.writeFileSync(path, JSON.stringify(clean, null, 2) + '\n');
  console.log('Cleaned vercel.json');
}
