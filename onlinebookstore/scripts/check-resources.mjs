import fs from 'node:fs';
import vm from 'node:vm';
const inventory=JSON.parse(fs.readFileSync('.runtime/frontend-audit.json','utf8'));
const nested=new Set();
async function inspect(url){
 try{const r=await fetch(url,{signal:AbortSignal.timeout(12000)});const buffer=await r.arrayBuffer();const bytes=buffer.byteLength;const type=r.headers.get('content-type');const text=new TextDecoder().decode(buffer);
 if(r.ok&&type?.includes('css'))for(const m of text.matchAll(/url\(["']?([^\s)"']+)["']?\)/g))if(!m[1].startsWith('data:'))nested.add(new URL(m[1],url).href);
 if(r.ok&&type?.includes('javascript'))new vm.Script(text,{filename:url});
 return{url,status:r.status,type,bytes};}
 catch(e){return{url,error:e.cause?.code??e.message};}
}
const results=await Promise.all(inventory.externalResources.filter(u=>!u.includes('DYNAMIC')).map(inspect));
results.push(...await Promise.all([...nested].map(inspect)));
fs.writeFileSync('.runtime/frontend-resources.json',JSON.stringify(results,null,2));
for(const result of results)console.log(JSON.stringify(result));
