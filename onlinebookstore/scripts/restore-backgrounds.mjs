import fs from 'node:fs';
import path from 'node:path';
const web=path.resolve(import.meta.dirname,'../src/main/webapp');
const assets=path.join(web,'assets/images');fs.mkdirSync(assets,{recursive:true});
const photos=[['library','1507842217343-583bb7270b66'],['books','1481627834876-b7833e8f5570'],['reading','1491841550275-ad7854e35ca6']];
for(const[name,id]of photos){const file=path.join(assets,name+'.jpg');if(!fs.existsSync(file)){const url=`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;const r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))throw Error(url+' '+r.status);fs.writeFileSync(file,Buffer.from(await r.arrayBuffer()));console.log(name,r.status);} }
for(const relative of ['index.jsp','book/genre-books.jsp','book/top-books.jsp']){const file=path.join(web,relative);let text=fs.readFileSync(file,'utf8');let n=0;text=text.replace(/https:\/\/source\.unsplash\.com\/random\/[^']+/g,()=>`<%=request.getContextPath()%>/assets/images/${photos[n++%photos.length][0]}.jpg`);fs.writeFileSync(file,text);}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const file of walk(web).filter(f=>f.endsWith('.jsp'))){const text=fs.readFileSync(file,'utf8');if(text.includes('<head>')&&!text.includes('rel="icon"'))fs.writeFileSync(file,text.replace('<head>','<head>\n    <link rel="icon" type="image/svg+xml" href="<%=request.getContextPath()%>/favicon.svg">'));}
