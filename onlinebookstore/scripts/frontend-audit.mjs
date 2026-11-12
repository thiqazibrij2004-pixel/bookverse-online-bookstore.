import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..'),web=path.join(root,'src/main/webapp');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const pages=walk(web).filter(f=>f.endsWith('.jsp'));
const mappings=new Set();
for(const f of walk(path.join(root,'src/main/java'))) {
 const annotation=fs.readFileSync(f,'utf8').match(/@WebServlet\(([^)]*)\)/s)?.[1]??'';
 for(const m of annotation.matchAll(/"(\/[^"\s]*)"/g)) mappings.add(m[1]);
}
const results=[];const resources=new Set();const findings=[];
for(const file of pages){
 const source=fs.readFileSync(file,'utf8');
 const normalized=source.replace(/<!--[\s\S]*?-->/g,'').replace(/<%=\s*request.getContextPath\(\)\s*%>/g,'/onlinebookstore').replace(/\$\{pageContext.request.contextPath\}/g,'/onlinebookstore').replace(/<%[\s\S]*?%>/g,'DYNAMIC');
 const links=[...normalized.matchAll(/\b(href|src|action)\s*=\s*(["'])(.*?)\2/gs)].map(m=>({kind:m[1],url:m[3].replace(/\s+/g,' ').trim()}));
 for(const {kind,url}of links){
  if(url.startsWith('http')) {if(kind==='src'||/\.(css|js)(\?|$)/.test(url))resources.add(url);continue;}
  if(!url||/^(#|javascript:|mailto:|data:)/.test(url)||url.includes('DYNAMIC')||url.includes('${'))continue;
  const target=new URL(url,'http://localhost:8081/onlinebookstore/'+path.relative(web,file).replaceAll('\\','/'));
  const relative=target.pathname.replace(/^\/onlinebookstore/,'');
  if(!target.pathname.startsWith('/onlinebookstore/')) findings.push({page:path.relative(web,file),kind,url,issue:'outside context path'});
  else if(!mappings.has(relative)&&!mappings.has(relative.split('/').slice(0,-1).join('/')+'/*')&&!fs.existsSync(path.join(web,relative)))findings.push({page:path.relative(web,file),kind,url,issue:'missing target'});
 }
 let scriptCount=0;
 for(const m of normalized.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){
  if(!m[1].trim())continue;scriptCount++;
  try{new vm.Script(m[1]);}catch(e){findings.push({page:path.relative(web,file),issue:'inline script syntax (template normalized)',error:e.message});}
 }
 results.push({page:path.relative(web,file),links,scriptCount,viewport:/name="viewport"/.test(source),tables:(source.match(/<table\b/g)||[]).length,responsiveTables:(source.match(/table-responsive/g)||[]).length,modals:(source.match(/class="modal /g)||[]).length,mediaQueries:(source.match(/@media/g)||[]).length});
}
const output={pages:results,externalResources:[...resources],findings};
fs.writeFileSync(path.resolve(root,'../.runtime/frontend-audit.json'),JSON.stringify(output,null,2));
console.log('JSP pages inspected:',pages.length,'inline scripts:',results.reduce((n,p)=>n+p.scriptCount,0));
console.log('External CSS/JS URLs:',[...resources].join('\n'));
console.log('Findings:',JSON.stringify(findings,null,2));
