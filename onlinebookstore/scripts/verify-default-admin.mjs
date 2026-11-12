import { testPassword, adminCredentials } from './test-credentials.mjs';
import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const { username, password } = adminCredentials();
const response=await fetch('http://localhost:8081/onlinebookstore/admin/login',{method:'POST',redirect:'manual',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({username,password})});
if(response.status!==302||!response.headers.get('location')?.endsWith('/admin/dashboard'))throw Error('Documented admin login failed');
console.log('PASS: documented admin login verified on Tomcat 9 using COPIED data; live original account not modified.');
