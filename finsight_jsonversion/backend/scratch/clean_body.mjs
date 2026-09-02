import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('c:/Users/selva/Desktop/HisabHero/finsight_jsonversion/backend/public/index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// Replace everything between <body> and <div id="landingView"> with just <body>\n
const bodyStart = content.indexOf('<body>');
const landingStart = content.indexOf('<div id="landingView"');

if (bodyStart !== -1 && landingStart !== -1) {
  content = content.substring(0, bodyStart + 6) + '\n\n' + content.substring(landingStart);
  fs.writeFileSync(indexPath, content, 'utf8');
  console.log("Successfully removed stray navbar fragment before landingView!");
} else {
  console.error("Could not find body or landingView");
}
