import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
function walk(p) { return fs.readdirSync(p, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(p,e.name)) : [path.join(p,e.name)]); }
const web = path.join(root,'src/main/webapp');
const mappings = new Map();
const forwards = [];
let errors = 0;
for (const file of walk(path.join(root,'src/main/java'))) {
  const text = fs.readFileSync(file,'utf8');
  for (const match of text.matchAll(/getRequestDispatcher\("([^"?]+)"\)/g)) {
    forwards.push({file,target:match[1]});
  }
  const annotation = text.match(/@WebServlet\(([^)]*)\)/s)?.[1];
  for (const match of (annotation ?? '').matchAll(/"(\/[^"\s]*)"/g)) {
    if (mappings.has(match[1])) { console.log('Duplicate mapping:',match[1]); errors++; }
    mappings.set(match[1],file);
  }
}
for(const {file,target} of forwards) {
  if(!fs.existsSync(path.join(web,target))&&!mappings.has(target)) {
    console.log('Missing forward:',path.relative(root,file),target); errors++;
  }
}
console.log('Servlet mappings:', [...mappings.keys()].join(', '));
console.log('Missing forwards / duplicate mappings:',errors);
