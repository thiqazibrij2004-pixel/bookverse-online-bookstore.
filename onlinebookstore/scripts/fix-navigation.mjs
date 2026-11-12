// One-time repair of confirmed stale links; no records or styles are changed.
import fs from 'node:fs';
import path from 'node:path';
const web=path.resolve(import.meta.dirname,'../src/main/webapp');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
for(const file of walk(web).filter(f=>f.endsWith('.jsp'))){
 let source=fs.readFileSync(file,'utf8'),before=source;
 for(const [from,to]of [['/admin/manage-orders.jsp','/admin/orders'],['/view-cart','/cart'],['/view-recommendations','/top-books']])source=source.replaceAll(from,to);
 source=source.replace(/(<%=\s*request.getContextPath\(\)\s*%>)\/profile(?=")/g,'$1/user/profile.jsp');
 source=source.replace(/href="<%=\s*request.getContextPath\(\)\s*%>\/(?:admin\/(?:manage-users|profile|system-settings)\.jsp|forgot-password)"/g,
   'aria-disabled="true" tabindex="-1" title="Not available in this version"');
 // Existing contact details already appear in each affected footer.
 if(source.includes('/contact')){
  source=source.replace(/href="<%=\s*request.getContextPath\(\)\s*%>\/contact"/g,'href="#contact-information"');
  source=source.replace('<address>','<address id="contact-information">');
 }
 if(source!==before){fs.writeFileSync(file,source);console.log(path.relative(web,file));}
}
