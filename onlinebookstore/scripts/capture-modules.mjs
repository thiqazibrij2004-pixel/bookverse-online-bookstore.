import { testPassword, adminCredentials } from './test-credentials.mjs';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import{Browser}from'./browser-cdp.mjs';
const workspace=path.resolve(import.meta.dirname,'../..');
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const output=path.join(workspace,'artifacts','bookverse-screenshots-'+stamp);fs.mkdirSync(output,{recursive:true});
const runtime=fs.readFileSync(path.join(workspace,'.runtime/screenshot-runtime-path.txt'),'utf8').replace(/^\uFEFF/,'').trim();
const base='http://localhost:8082/onlinebookstore';const manifest=[];
const rows=name=>fs.readFileSync(path.join(runtime,'data',name+'.txt'),'utf8').split(/\r?\n/).filter(Boolean);
function session(){let cookie='';return{get cookie(){return cookie;},async post(route,form){const r=await fetch(base+route,{method:'POST',redirect:'manual',headers:{cookie,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams(form)});const sid=r.headers.getSetCookie().find(v=>v.startsWith('JSESSIONID='));if(sid)cookie=sid.split(';')[0];if(r.status>=400)throw Error('Screenshot setup failed: '+route+' HTTP '+r.status);return{location:r.headers.get('location'),text:await r.text()};}};}
const customer=session(),admin=session();const username='screen_'+Date.now().toString().slice(-9),password='Ss1@'+crypto.randomBytes(12).toString('base64').slice(0,16);
await customer.post('/register',{fullName:'Screenshot Customer',username,email:username+'@example.com',password,confirmPassword:password,termsAgreement:'on'});
const login=await customer.post('/login',{username,password});if(!login.location?.endsWith('/index.jsp'))throw Error('Screenshot customer login failed');
const book=rows('books').map(s=>s.split(',')).find(s=>s[0]==='PHYSICAL'&&Number(s[10])>=2);if(!book)throw Error('Need a book in stock in copied data');const bid=book[1];
const reviewFormBook=rows('books').map(s=>s.split(',')).find(s=>s[1]!==bid)?.[1]??bid;
const wishlist=await customer.post('/wishlists',{action:'create',name:'Reading Collection',description:'Books to read next',isPublic:'on'});const wid=new URL(wishlist.location,base).searchParams.get('id');
await customer.post('/wishlist-item',{action:'add-to-selected',wishlistId:wid,bookId:bid,notes:'Next on my reading list',priority:'4'});
await customer.post('/add-book-review',{bookId:bid,rating:'4',comment:'An engaging read with memorable characters. Looking forward to more books by this author.'});
const review=rows('reviews').map(s=>s.split(',')).find(s=>s[2]===username);if(!review)throw Error('Review setup failed');const rid=review[0];
await customer.post('/add-to-cart',{bookId:bid,quantity:'1'});await customer.post('/checkout',{shippingAddress:'123 Reading Street',billingAddress:'123 Reading Street',contactEmail:username+'@example.com',contactPhone:'0771234567'});
const paid=await customer.post('/process-payment',{paymentMethod:'CREDIT_CARD',cardNumber:'4111111111111111',cardName:'Screenshot Customer'});const oid=new URL(paid.location,base).searchParams.get('orderId');if(!oid)throw Error('Order setup failed');
await customer.post('/add-to-cart',{bookId:bid,quantity:'2'});
const {username:adminUser,password:adminPassword}=adminCredentials();
const al=await admin.post('/admin/login',{username:adminUser,password:adminPassword});if(!al.location?.includes('/admin/dashboard'))throw Error('Screenshot admin login failed');
const b=await Browser.open();await b.viewport(1440,1000);
async function use(s){await b.send('Network.clearBrowserCookies');if(s)await b.send('Network.setCookie',{name:'JSESSIONID',value:s.cookie.split('=')[1],url:base+'/',path:'/onlinebookstore',httpOnly:true});}
async function image(module,title,source,route,{modal,component,note}={}){
 if(title==='Add Review')route='/add-book-review?bookId='+reviewFormBook;
 const folder=path.join(output,module);fs.mkdirSync(folder,{recursive:true});const file=title.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.png';
 try{
  await b.go(base+route);await b.eval('document.fonts.ready');await new Promise(r=>setTimeout(r,250));
  if(modal){await b.click(modal);await new Promise(r=>setTimeout(r,650));}
  let params={format:'png',captureBeyondViewport:true};
  if(component){const clip=await b.eval(`(()=>{const e=document.querySelector(${JSON.stringify(component)});if(!e)throw Error('Component not found');const r=e.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1};})()`);params.clip=clip;}
  else if(modal){params.captureBeyondViewport=false;}
  else{const metrics=await b.send('Page.getLayoutMetrics');params.clip={x:0,y:0,width:1440,height:Math.min(Math.ceil(metrics.cssContentSize.height),16000),scale:1};}
  const shot=await b.send('Page.captureScreenshot',params);fs.writeFileSync(path.join(folder,file),Buffer.from(shot.data,'base64'));
  const titleActual=await b.eval('document.title');const failed=/HTTP Status [45]\d\d/.test(titleActual);
  manifest.push({module,title,source,route,file:module+'/'+file,status:failed?'Error page captured':'Captured',note:note??'',pageTitle:titleActual});console.log('CAPTURED',module,title);
 }catch(e){manifest.push({module,title,source,route,status:'Not captured',note:e.message});console.log('NOT CAPTURED',module,title,e.message);}
}
try{
 await use(null);
 for(const item of [ ['01-home','Homepage','index.jsp','/'],['02-books','Book Catalog','book/book-catalog.jsp','/books'],['02-books','Search Results','book/book-catalog.jsp','/books?search=Educated'],['02-books','Book Details','book/book-details.jsp','/book-details?id='+bid],['02-books','Genre Books','book/genre-books.jsp','/genre?genre='+encodeURIComponent(book[7])],['02-books','Top Books','book/top-books.jsp','/top-books'],['03-account','Customer Login','user/login.jsp','/login'],['03-account','Registration','user/register.jsp','/register'],['08-admin','Admin Login','admin/login.jsp','/admin/login'] ])await image(...item);
 await use(customer);
 for(const item of [['03-account','Customer Profile','user/profile.jsp','/user/profile.jsp'],['03-account','Update Profile','user/update-profile.jsp','/update-profile'],['03-account','Upgrade Premium','user/upgrade-premium.jsp','/upgrade-to-premium'],['04-cart','Shopping Cart','cart.jsp','/cart'],['05-wishlist','My Wishlists','wishlist/wishlists.jsp','/wishlists'],['05-wishlist','Create Wishlist','wishlist/create-wishlist.jsp','/wishlists?action=create'],['05-wishlist','Wishlist Details','wishlist/wishlist-details.jsp','/wishlists?action=view&id='+wid],['05-wishlist','Edit Wishlist','wishlist/edit-wishlist.jsp','/wishlists?action=edit&id='+wid],['05-wishlist','Select Wishlist','wishlist/select-wishlist.jsp','/wishlist-item?action=select-wishlist&bookId='+bid],['05-wishlist','Edit Wishlist Item','wishlist/edit-item.jsp','/wishlist-item?action=edit&wishlistId='+wid+'&bookId='+bid],['06-orders','Checkout','order/checkout.jsp','/checkout'],['06-orders','Order Confirmation','order/order-confirmation.jsp','/order-confirmation?orderId='+oid],['06-orders','Order History','order/order-history.jsp','/order-history'],['06-orders','Order Details','order/order-details.jsp','/order-details?orderId='+oid],['07-reviews','Add Review','review/add-review.jsp','/add-book-review?bookId='+bid],['07-reviews','Book Reviews','review/book-reviews.jsp','/book-reviews?bookId='+bid],['07-reviews','My Reviews','review/user-review.jsp','/user-reviews'],['07-reviews','Edit Review','review/edit-review.jsp','/update-book-review?reviewId='+rid],['07-reviews','Delete Review Confirmation','review/delete-review.jsp','/delete-book-review?reviewId='+rid]])await image(...item);
 // A second copied-data checkout supplies the payment page's required pending-order state.
 await customer.post('/checkout',{shippingAddress:'123 Reading Street',billingAddress:'123 Reading Street',contactEmail:username+'@example.com',contactPhone:'0771234567'});
 await image('06-orders','Payment Form','order/payment-form.jsp','/process-payment');
 await image('03-account','Delete Account Modal','user/profile.jsp','/user/profile.jsp',{modal:'[data-bs-target="#deleteAccountModal"]'});
 await image('05-wishlist','Delete Wishlist Modal','wishlist/wishlist-details.jsp','/wishlists?action=view&id='+wid,{modal:'[data-bs-target="#deleteWishlistModal"]'});
 await image('06-orders','Cancel Order Modal','order/order-details.jsp','/order-details?orderId='+oid,{modal:'[data-bs-target="#cancelOrderModal"]'});
 await image('09-shared','Shared Header','includes/header.jsp','/wishlists',{component:'nav.navbar',note:'Shared JSP fragment captured within a normal page.'});
 await image('09-shared','Shared Footer','includes/footer.jsp','/wishlists',{component:'footer',note:'Shared JSP fragment captured within a normal page.'});
 await use(admin);
 for(const item of [['08-admin','Dashboard','admin/dashboard.jsp','/admin/dashboard'],['08-admin','Manage Books','admin/manage-books.jsp','/admin/manage-books.jsp'],['08-admin','Add Book','admin/add-book.jsp','/admin/add-book'],['08-admin','Edit Book','admin/edit-book.jsp','/admin/update-book?id='+bid],['08-admin','Manage Administrators','admin/manage-admins.jsp','/admin/manage-admins'],['08-admin','Manage Orders','admin/order/orders.jsp','/admin/orders'],['08-admin','Admin Order Details','admin/order/order-details.jsp','/admin/order-details?orderId='+oid]])await image(...item);
 await image('08-admin','Legacy Update Order Template','admin/order/update-order.jsp','/admin/order/update-order.jsp',{note:'Legacy standalone JSP: no active GET controller supplies order data. Captured its actual direct-access state.'});
 for(const [title,selector,route,source]of[['Add Administrator Modal','[data-bs-target="#addAdminModal"]','/admin/manage-admins','admin/manage-admins.jsp'],['Delete Book Modal','button[onclick^="confirmDelete"]','/admin/manage-books.jsp','admin/manage-books.jsp'],['Update Order Status Modal','[data-bs-target="#updateStatusModal"]','/admin/order-details?orderId='+oid,'admin/order/order-details.jsp']])await image('08-admin',title,source,route,{modal:selector});
}finally{
 fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({viewport:{width:1440,height:1000},base,capturedAt:new Date().toISOString(),pages:manifest,consoleErrors:b.errors,failedRequests:b.network},null,2));
 const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 const modules=[...new Set(manifest.map(m=>m.module))];
 const cards=modules.map(module=>`<section id="${module}"><h2>${esc(module.replace(/^\d+-/,''))}</h2><div class="grid">${manifest.filter(m=>m.module===module).map(m=>`<article><h3>${esc(m.title)}</h3><p>${esc(m.source)} · ${esc(m.status)}</p>${m.file?`<a href="${m.file}" target="_blank"><img loading="lazy" src="${m.file}" alt="${esc(m.title)}"></a><p><a href="${m.file}" target="_blank">Open full screenshot</a></p>`:''}<p>${esc(m.note)}</p></article>`).join('')}</div></section>`).join('');
 fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BookVerse module screenshots</title><style>body{background:#121212;color:#f5f5f5;font:16px system-ui;margin:0;padding:32px}a{color:#bb9aff}nav{display:flex;gap:18px;flex-wrap:wrap}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}article{background:#252525;padding:18px;border-radius:10px;min-width:0}img{width:100%;height:350px;object-fit:cover;object-position:top;background:#171717}p{font-size:13px;overflow-wrap:anywhere;color:#b0b0b0}h1,h2{color:#a582ff}section{margin:40px 0}</style></head><body><h1>BookVerse module screenshots</h1><p>Actual Chrome captures. Desktop width 1440px. Click each thumbnail to see the full image. Workflow data was created exclusively in a separate copied dataset; live records were untouched. Shared header/footer are fragments, not standalone pages.</p><nav>${modules.map(m=>`<a href="#${m}">${esc(m.replace(/^\d+-/,''))}</a>`).join('')}</nav>${cards}</body></html>`);
 fs.writeFileSync(path.join(workspace,'.runtime/latest-screenshot-folder.txt'),output);
 console.log('OUTPUT',output);console.log('TOTAL',manifest.length,'FILES',manifest.filter(m=>m.file).length,'UNAVAILABLE',manifest.filter(m=>m.status!=='Captured').length);b.close();
}
