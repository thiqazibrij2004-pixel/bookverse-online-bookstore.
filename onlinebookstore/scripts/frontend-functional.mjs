import { testPassword, adminCredentials } from './test-credentials.mjs';
// HTTP verification only; this does not execute a browser or render CSS.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const base='http://localhost:8081/onlinebookstore';
const data=path.resolve(import.meta.dirname,'../../.runtime/test-data');
const records=name=>fs.readFileSync(path.join(data,name+'.txt'),'utf8').trim().split(/\r?\n/).filter(Boolean);
const results={pages:[],checks:[],issues:[],localResources:[]};
const localResources=new Set();let cookie='';
function check(condition,message){assert(condition,message);results.checks.push(message);console.log('PASS',message);}
async function req(route,form){
 const r=await fetch(new URL(route.startsWith('/onlinebookstore')?route:base+route,base),{redirect:'manual',method:form?'POST':'GET',headers:{cookie,...(form?{'content-type':'application/x-www-form-urlencoded'}:{})},body:form?new URLSearchParams(form):undefined});
 const session=r.headers.getSetCookie().find(s=>s.startsWith('JSESSIONID='));if(session)cookie=session.split(';')[0];
 const text=await r.text();assert(r.status<400,route+' HTTP '+r.status+' '+text.slice(-500));
 return{status:r.status,text,location:r.headers.get('location'),type:r.headers.get('content-type')};
}
async function page(route,expected){
 let r=await req(route);for(let i=0;r.location&&i<5;i++)r=await req(r.location);
 assert.equal(r.status,200,route);if(expected)assert(r.text.includes(expected),route+' expected '+expected);
 const html=r.text.replace(/<!--[\s\S]*?-->/g,'');
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);const idSet=new Set(ids);
 for(const id of new Set(ids.filter((id,i)=>ids.indexOf(id)!==i)))results.issues.push({route,issue:'duplicate id',id});
 for(const m of html.matchAll(/\bdata-bs-target="#([^"]+)"/g))if(!idSet.has(m[1]))results.issues.push({route,issue:'missing Bootstrap target',target:m[1]});
 for(const m of html.matchAll(/href="#([^"]+)"/g))if(!idSet.has(m[1]))results.issues.push({route,issue:'missing fragment',target:m[1]});
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(m[1].trim())new vm.Script(m[1],{filename:route});
 for(const m of html.matchAll(/<(?:script|img|link)\b[^>]*?\b(?:src|href)="([^"]+)"/gi))if(m[1].startsWith('/onlinebookstore/'))localResources.add(m[1].replaceAll('&amp;','&'));
 results.pages.push(route);return r;
}
const count=records('users').length;
const username='front_'+Date.now().toString().slice(-10),password=testPassword();
const registration={username,password,confirmPassword:password,fullName:'Frontend Verification',email:username+'@example.com',termsAgreement:'on'};
try{
 for(const route of ['/','/books','/top-books','/genre?genre=Fiction','/search-book?searchQuery=Educated','/login','/register','/cart','/admin/login'])await page(route);
 for(const route of ['/wishlists','/checkout','/order-history','/user-reviews'])check((await req(route)).location?.endsWith('/login'),'Anonymous guard '+route);
 for(const [values,error]of [[{},'All fields are required'],[{...registration,confirmPassword:'different'},'Passwords do not match'],[{...registration,email:'invalid'},'Invalid email format'],[{...registration,password:'weak',confirmPassword:'weak'},'Password must be at least']]){
  check((await req('/register',values)).text.includes(error),'Registration rejects '+error);
 }
 check(records('users').length===count,'Invalid registrations do not create records');
 await req('/register',registration);check(records('users').some(s=>s.includes(','+username+',')),'Valid registration persisted');
 check((await req('/register',registration)).text.includes('Username already exists'),'Duplicate username rejected');
 check((await req('/login',{username,password:'incorrect'})).text.includes('Invalid username or password'),'Wrong password rejected');
 await req('/login',{username,password});await page('/user/profile.jsp',username);await page('/update-profile');await page('/upgrade-to-premium');
 check((await req('/checkout')).location?.endsWith('/cart'),'Empty cart cannot checkout');
 check((await req('/add-to-cart',{})).location?.endsWith('/books'),'Missing cart book handled');
 const book=records('books').map(s=>s.split(',')).find(s=>s[0]==='PHYSICAL'&&Number(s[10])>=2);assert(book,'Need copied book stock');const bid=book[1];
 await page('/book-details?id='+bid);await req('/add-to-cart',{bookId:bid,quantity:'1'});await page('/cart',book[2]);
 const orderCount=records('orders').length;
 await req('/checkout',{shippingAddress:'',billingAddress:'',contactEmail:'',contactPhone:''});await page('/checkout','All fields are required');
 check(records('orders').length===orderCount,'Missing checkout fields create no order');
 const wCount=records('wishlists').length;
 await req('/wishlists',{action:'create',name:''});await page('/wishlists?action=create','Wishlist name is required');
 check(records('wishlists').length===wCount,'Empty wishlist name creates no record');
 const w=await req('/wishlists',{action:'create',name:'Frontend List',description:'Validation test'});const wid=new URL(w.location,base).searchParams.get('id');assert(wid);
 await page('/wishlists');await page('/wishlists?action=view&id='+wid);await page('/wishlists?action=edit&id='+wid);
 await page('/wishlist-item?action=select-wishlist&bookId='+bid);
 await req('/wishlist-item',{action:'add-to-selected',wishlistId:wid,bookId:bid,priority:'3',notes:'Frontend test'});
 await page('/wishlist-item?action=edit&wishlistId='+wid+'&bookId='+bid);
 await req('/wishlist-item',{action:'update',wishlistId:wid,bookId:bid,priority:'5',notes:'Changed note'});
 check(records('wishlist_items').some(s=>s.startsWith(wid+','+bid+',Changed note,5,')),'Wishlist item edit persisted');
 const reviewCount=records('reviews').length;
 await page('/add-book-review?bookId='+bid);
 check((await req('/add-book-review',{bookId:bid,rating:'9',comment:'Invalid'})).text.includes('Invalid rating'),'Out-of-range review rejected');
 check((await req('/add-book-review',{bookId:bid,rating:'4',comment:''})).text.includes('All fields are required'),'Empty review rejected');
 check(records('reviews').length===reviewCount,'Invalid reviews create no record');
 await req('/add-book-review',{bookId:bid,rating:'4',comment:'Frontend validation review'});
 const review=records('reviews').find(s=>s.includes(','+username+',')).split(',');const rid=review[0];
 await page('/book-reviews?bookId='+bid);await page('/user-reviews','Frontend validation review');await page('/update-book-review?reviewId='+rid);await page('/delete-book-review?reviewId='+rid);
 await req('/checkout',{shippingAddress:'123 Verification Road',contactEmail:registration.email,contactPhone:'0771234567',sameAsBilling:'on'});await page('/process-payment');
 const beforePayment=records('payments').length;
 await req('/process-payment',{paymentMethod:'CREDIT_CARD',cardNumber:'',cardName:''});await page('/process-payment','Card information is required');
 check(records('payments').length===beforePayment,'Missing card fields create no payment');
 for(const values of [{},{paymentMethod:'INVALID'}]){
  await req('/process-payment',values);await page('/process-payment','Please select a valid payment method');
  check(records('payments').length===beforePayment,'Invalid/missing payment method creates no payment');
 }
 const paid=await req('/process-payment',{paymentMethod:'CREDIT_CARD',cardNumber:'4111111111111111',cardName:'Frontend Verification'});
 check(paid.location?.includes('order-confirmation'),'Valid demo payment accepted');const oid=new URL(paid.location,base).searchParams.get('orderId');
 await page('/order-confirmation?orderId='+oid);await page('/order-history');await page('/order-details?orderId='+oid);
 await req('/logout');check((await req('/wishlists')).location?.endsWith('/login'),'Logout removes protected access');
 check((await req('/admin/login',{username:adminCredentials().username,password:'wrong'})).text.includes('Invalid'),'Invalid admin credentials rejected');
 await req('/admin/login',{username:adminCredentials().username,password:adminCredentials().password});
 for(const route of ['/admin/dashboard','/admin/manage-books.jsp','/admin/manage-admins','/admin/add-book','/admin/update-book?id='+bid,'/admin/orders','/admin/order-details?orderId='+oid])await page(route);
 const beforeStatus=records('orders').find(s=>s.startsWith(oid+'|'));
 await req('/admin/update-order-status',{orderId:oid,status:'INVALID'});await page('/admin/order-details?orderId='+oid,'Invalid order status');
 check(records('orders').find(s=>s.startsWith(oid+'|'))===beforeStatus,'Invalid admin status does not alter order');
 await req('/admin/update-order-status',{orderId:oid,status:'PROCESSING',notes:'Frontend verification'});
 check(records('orders').some(s=>s.startsWith(oid+'|')&&s.includes('PROCESSING')),'Admin order status update persisted');
 await page('/admin/orders');await page('/admin/order-details?orderId='+oid);
 for(const url of localResources){const r=await fetch('http://localhost:8081'+url);assert.equal(r.status,200,url);const bytes=(await r.arrayBuffer()).byteLength;assert(bytes>0,url);results.localResources.push({url,status:r.status,type:r.headers.get('content-type'),bytes});}
 check(results.localResources.length>0,'Rendered local resources fetched under context path');
}finally{
 fs.writeFileSync(path.resolve(data,'../frontend-functional.json'),JSON.stringify(results,null,2));
 console.log('RENDERED ISSUES',JSON.stringify(results.issues));
 console.log('Rendered pages',results.pages.length,'checks',results.checks.length,'local resources',results.localResources.length);
}
