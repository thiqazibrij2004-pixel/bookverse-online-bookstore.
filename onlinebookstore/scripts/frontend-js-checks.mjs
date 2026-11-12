// Focused function tests with DOM stubs, not browser/visual verification.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const web=path.resolve(import.meta.dirname,'../src/main/webapp');let count=0;
const check=(value,label)=>{assert(value,label);console.log('PASS',label);count++;};
function load(file){
 const source=fs.readFileSync(path.join(web,file),'utf8');const nodes=new Map(),listeners=new Map();
 function node(id){if(!nodes.has(id)){const events=new Map(),classes=new Set();nodes.set(id,{value:'',type:'password',checked:false,required:false,files:[],style:{},textContent:'',innerText:'',validity:'',events,classList:{add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x)),contains:x=>classes.has(x)},setCustomValidity(message){this.validity=message;},getAttribute(name){return this[name];},addEventListener(name,fn){events.set(name,fn);},setAttribute(name,value){this[name]=value;},removeAttribute(name){delete this[name];},focus(){}});}return nodes.get(id);}
 const document={getElementById:node,querySelectorAll:selector=>selector==='.payment-method'?['credit-card-method','debit-card-method','paypal-method','bank-transfer-method'].map(node):[],querySelector:selector=>node(selector),addEventListener:(name,fn)=>listeners.set(name,fn)};
 const context=vm.createContext({document,alert:()=>{},console,window:{addEventListener(){}},URL,Date,sessionStorage:{getItem(){},setItem(){},removeItem(){}}});
 for(const m of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(m[1].trim())vm.runInContext(m[1].replace(/<%=[\s\S]*?%>/g,'3'),context);
 return{context,node,listeners};
}
let t=load('user/login.jsp');t.context.togglePasswordVisibility();check(t.node('password').type==='text','Login password reveal');t.context.togglePasswordVisibility();check(t.node('password').type==='password','Login password conceal');
t=load('user/register.jsp');
function submit(password,confirmation){t.node('password').value=password;t.node('confirmPassword').value=confirmation;let prevented=false;t.node('registrationForm').events.get('submit')({preventDefault(){prevented=true;}});return prevented;}
check(submit('Password123!','Password123!'),'Registration rejects unsupported special character');
check(submit('Short1@','Short1@'),'Registration rejects short password');
check(submit('Password123@','different'),'Registration rejects mismatched confirmation');
check(!submit('Password123@','Password123@'),'Registration accepts server-compatible password');
t=load('user/update-profile.jsp');t.node('newPassword').value='Password123@';t.node('confirmPassword').value='Password123@';t.context.validatePasswordMatch();check(t.node('confirmPassword').validity==='','Profile matching passwords valid');t.node('newPassword').value='Changed123@';t.node('newPassword').events.get('input')();check(t.node('confirmPassword').validity!== '','Editing original password revalidates confirmation');t.node('confirmPassword').value='Changed123@';t.node('confirmPassword').events.get('input')();check(t.node('confirmPassword').validity==='','Corrected confirmation clears custom error');
t=load('book/book-details.jsp');t.node('quantity').value='1';t.node('quantity').max='3';t.context.decreaseQuantity();check(Number(t.node('quantity').value)===1,'Quantity does not fall below one');for(let i=0;i<5;i++)t.context.increaseQuantity();check(Number(t.node('quantity').value)===3,'Quantity does not exceed stock');
t=load('order/checkout.jsp');let handler=t.node('sameAsBilling').events.get('change');handler.call({checked:true});check(t.node('billingAddressSection').style.display==='none'&&!t.node('billingAddress').required,'Same-address selection hides billing requirement');handler.call({checked:false});check(t.node('billingAddressSection').style.display==='block'&&t.node('billingAddress').required,'Separate address restores billing requirement');
t=load('order/payment-form.jsp');for(const method of ['CREDIT_CARD','DEBIT_CARD','PAYPAL','BANK_TRANSFER']){t.context.selectPaymentMethod(method);check(t.node(method.toLowerCase().replace('_','-')+'-method').classList.contains('selected'),'Payment selection '+method);}
const number={value:'4111abc111111111111'};t.context.formatCardNumber(number);check(number.value==='4111 1111 1111 1111','Card number removes non-digits and groups digits');const expiry={value:'1228'};t.context.formatExpiry(expiry);check(expiry.value==='12/28','Expiry date formatting');
for(const file of ['wishlist/edit-item.jsp','wishlist/select-wishlist.jsp']){t=load(file);t.context.selectPriority(5);check(Number(t.node('priority').value)===5&&t.node('priority-label').textContent==='Very High','Wishlist priority '+file);}
for(const file of ['admin/add-book.jsp','admin/edit-book.jsp']){t=load(file);t.node('isbn').value='invalid';check(t.context.validateForm('physical')===false,'Invalid ISBN '+file);t.node('isbn').value='9780399590504';t.node('coverImage').files=[{size:6*1024*1024}];check(t.context.validateForm('physical')===false,'Oversized cover '+file);t.node('coverImage').files=[];check(t.context.validateForm('physical')===true,'Valid ISBN '+file);}
console.log('DOM-stub function checks passed:',count);
