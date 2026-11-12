import fs from 'node:fs';import path from 'node:path';import{Browser}from'./browser-cdp.mjs';
const dir=path.resolve(import.meta.dirname,'../../.runtime/browser-results'),b=await Browser.open(),results=[];
try{
 for(const[w,h]of[[1440,900],[768,1024],[375,812]]){
  await b.viewport(w,h);await b.go('http://localhost:8080/onlinebookstore/');await b.shot(path.join(dir,'live-home-'+w+'.png'));
  const sizes=await b.eval('({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,background:getComputedStyle(document.body).backgroundColor,broken:Array.from(document.images).filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src),icon:document.querySelector("link[rel=icon]")?.href})');
  results.push({name:'Final live homepage '+w,status:sizes.scroll<=sizes.client+1&&!sizes.broken.length&&sizes.background==='rgb(18, 18, 18)'&&sizes.icon?.endsWith('/onlinebookstore/favicon.svg')?'PASS':'FAIL',details:sizes});
 }
 const decoded=await b.eval(`Promise.all(Array.from(document.querySelectorAll('*')).flatMap(e=>Array.from(getComputedStyle(e).backgroundImage.matchAll(/url\\("?([^"\\)]+)"?\\)/g)).map(m=>m[1])).filter((v,i,a)=>a.indexOf(v)===i).map(src=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve({src,loaded:true});image.onerror=()=>resolve({src,loaded:false});image.src=src;})))`);
 results.push({name:'Final live CSS background images decode',status:decoded.length&&decoded.every(i=>i.loaded)?'PASS':'FAIL',details:decoded});
 results.push({name:'Final live browser console',status:b.errors.length?'FAIL':'PASS',details:b.errors});results.push({name:'Final live browser network',status:b.network.length?'FAIL':'PASS',details:b.network});
}catch(e){results.push({name:'Live browser continuation',status:'FAIL',details:e.stack});}
finally{fs.writeFileSync(path.join(dir,'live-results.json'),JSON.stringify({results,consoleErrors:b.errors,failedRequests:b.network},null,2));console.log(JSON.stringify(results,null,2));b.close();}
