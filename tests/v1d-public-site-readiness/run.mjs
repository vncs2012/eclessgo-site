import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawn, execFileSync} from 'node:child_process';
import net from 'node:net';
import http from 'node:http';
import assert from 'node:assert/strict';
import {startFixture} from './fixture.mjs';
import {publicJourney} from './public.spec.mjs';

process.umask(0o077);
const prepared = path.resolve(process.argv[2]);
const reserve = path.join(prepared, 'execution-' + Date.now());
fs.mkdirSync(reserve, {mode:0o700});
const app = path.join(reserve, 'app');
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
assert(fs.existsSync(path.join(prepared, 'restoration.json')), 'prepare must finish first');
execFileSync('python3',[path.join(repo,'tests/v1d-public-site-readiness/guard.py'),'clone',prepared,app],{stdio:'inherit'});
const {chromium} = await import(pathToFileURL(path.join(app, 'node_modules/playwright/index.mjs')));
const {expect} = await import(pathToFileURL(path.join(app, 'node_modules/@playwright/test/index.mjs')));
expect.configure({timeout: 15000});
const put = (name, value) => fs.writeFileSync(path.join(reserve, name), JSON.stringify(value, null, 2), {flag: 'wx', mode: 0o600});
const log = (name, value) => fs.appendFileSync(path.join(reserve, name), JSON.stringify(value) + '\n', {mode: 0o600});
const preload = path.join(reserve, 'loopback-only.cjs');
fs.writeFileSync(preload, `const net=require('node:net'),fs=require('node:fs');
const connect=net.Socket.prototype.connect;
net.Socket.prototype.connect=function(...args){
 const a=Array.isArray(args[0])?args[0][0]:args[0];
 const host=a&&typeof a==='object'?a.host:typeof args[1]==='string'?args[1]:undefined;
 if(host&&!['127.0.0.1','localhost','::1'].includes(host)){
 fs.appendFileSync(process.env.V1D_NETWORK_LOG,JSON.stringify({blocked:host})+'\\n',{mode:0o600});
 throw new Error('V1d external server network blocked');}
 return connect.apply(this,args);
};\n`, {flag: 'wx', mode: 0o600});
const cleanEnv = {
  PATH: path.dirname(process.execPath) + ':/usr/bin:/bin',
  HOME: path.join(reserve, 'home'), TMPDIR: path.join(reserve, 'tmp'),
  NEXT_TELEMETRY_DISABLED: '1', ASSISTANT_ENABLED: 'false', NODE_ENV: 'development',
  NODE_OPTIONS: '--require=' + preload, V1D_NETWORK_LOG: path.join(reserve, 'server-external.jsonl'),
};
for (const dir of ['home', 'tmp', 'artifacts']) fs.mkdirSync(path.join(reserve, dir), {mode: 0o700});
const checks = [];
const journeyFailures = [];
let failure;
async function freePort() {
 const s = net.createServer();
 await new Promise(resolve => s.listen(0, '127.0.0.1', resolve));
 const port = s.address().port;
 await new Promise(resolve => s.close(resolve));
 return port;
}
async function healthy(url, proc) {
 for(let i=0;i<120;i++) {
  if(proc.exitCode!==null) throw new Error(`Next exited ${proc.exitCode}`);
  try {const r=await fetch(url);if(r.ok)return;} catch {}
  await new Promise(resolve=>setTimeout(resolve,500));
 }
 throw new Error('Next readiness failed');
}
try {
 for(const mode of ['healthy','empty','unavailable']) {
  const fixture = await startFixture(mode, path.join(reserve, 'fixture.jsonl'));
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const stdout=fs.openSync(path.join(reserve, `${mode}-next.stdout.log`),'wx',0o600);
  const stderr=fs.openSync(path.join(reserve, `${mode}-next.stderr.log`),'wx',0o600);
  const proc=spawn(process.execPath,[path.join(app,'node_modules/next/dist/bin/next'),'dev','--webpack','-H','127.0.0.1','-p',String(port)],{
   cwd:app,env:{...cleanEnv,API_BASE_URL:fixture.origin+'/api/v1',NEXT_PUBLIC_SITE_URL:origin,NEXT_PUBLIC_PANEL_URL:origin+'/off-panel'},stdio:['ignore',stdout,stderr],detached:true,
  });
  fs.closeSync(stdout);fs.closeSync(stderr);
  let browser;
  const browserTmp=fs.mkdtempSync('/tmp/v1d-');fs.chmodSync(browserTmp,0o700);
  log('browser-reservations.jsonl',{mode,path:browserTmp,profile:'new persistent, retained'});
  try {
   await healthy(origin,proc);
   log('servers.jsonl',{mode,origin,fixture:fixture.origin,pid:proc.pid,healthy:true,providers:false});
   console.log(JSON.stringify({ready:origin,mode,fixture:fixture.origin,providers:'OFF',visible:process.env.V1D_HEADED==='1'}));
   if(process.argv.includes('--serve')) {
    const proxy=http.createServer((request,response)=>{
     const upstream=http.request(origin+request.url,{method:request.method,headers:{...request.headers,host:new URL(origin).host}},res=>{
      response.writeHead(res.statusCode,{...res.headers,'content-security-policy':"default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src 'none'; form-action 'self'"});
      res.pipe(response);
     });
     upstream.on('error',()=>{response.writeHead(502);response.end('Local demo unavailable');});request.pipe(upstream);
    });
    await new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve));
    const demo=`http://127.0.0.1:${proxy.address().port}`;
    log('demo.jsonl',{url:demo,next:origin,fixture:fixture.origin,context:'separate Codex panel; not test runner',external:'CSP blocked',providers:false});
    console.log(JSON.stringify({DEMO_READY:demo,next:origin,external:'CSP blocked',providers:'OFF',context:'separate panel'}));
    await new Promise(resolve=>{process.once('SIGINT',resolve);process.once('SIGTERM',resolve);});
    await new Promise(resolve=>proxy.close(resolve));
    break;
   }

   const persistent=await chromium.launchPersistentContext(path.join(browserTmp,'profile'),{executablePath:'/usr/bin/google-chrome',headless:process.env.V1D_HEADED!=='1',env:{PATH:cleanEnv.PATH,HOME:cleanEnv.HOME,TMPDIR:browserTmp,DISPLAY:process.env.DISPLAY||':0',XAUTHORITY:process.env.XAUTHORITY||'',DBUS_SESSION_BUS_ADDRESS:process.env.DBUS_SESSION_BUS_ADDRESS||''},args:['--disable-background-networking','--disable-component-update','--disable-sync','--disable-default-apps','--no-first-run']});
   browser=persistent.browser();
   for(const [label,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
    const context=await browser.newContext({viewport,locale:'pt-BR',serviceWorkers:'block'});
    await context.route('**/*',async route=>{
     const u=new URL(route.request().url());
     if(u.origin!==origin && !['data:','blob:'].includes(u.protocol)) {
      log('external-blocked.jsonl',{mode,label,url:u.origin+u.pathname,method:route.request().method()});
      await route.abort('blockedbyclient');return;
     }
     log('browser-requests.jsonl',{mode,label,method:route.request().method(),path:u.pathname});
     await route.continue();
    });
    const page=await context.newPage();
    page.on('console',message=>log('console.jsonl',{mode,label,type:message.type(),text:message.text()}));
    page.on('pageerror',error=>log('pageerrors.jsonl',{mode,label,message:error.message}));
    await context.tracing.start({screenshots:true,snapshots:true,sources:true});
    const check=(name,actual,expected,ac)=>{
     const item={mode,label,name,actual,expected,ac,ok:actual===expected};checks.push(item);log('checks.jsonl',item);assert.equal(actual,expected,name);
    };
    try {
     await publicJourney({page,expect,origin,mode,check,report:item=>log('assertions.jsonl',{mode,label,...item}),capture:async name=>{
      await page.screenshot({path:path.join(reserve,'artifacts',`${mode}-${label}-${name}.png`),fullPage:true});
     }});
     log('journeys.jsonl',{mode,label,status:'PASS'});
    } catch(error) {
     await page.screenshot({path:path.join(reserve,'artifacts',`${mode}-${label}-FAIL.png`),fullPage:true}).catch(()=>{});
     log('journeys.jsonl',{mode,label,status:'FAIL',message:error.stack});journeyFailures.push({mode,label,error:error.stack});
    } finally {
     await context.tracing.stop({path:path.join(reserve,'artifacts',`${mode}-${label}.zip`)});
     await context.close();
    }
   }
  } finally {
   if(browser)await browser.close();
   try{process.kill(-proc.pid,'SIGTERM');}catch{}
   await new Promise(resolve=>fixture.server.close(resolve));
  }
 }
} catch(error) {failure=error;console.error(error.stack);}
finally {
 failure ||= journeyFailures.length ? new Error('V1d journey failures; aggregate FAIL') : undefined;
 put('result.json',{status:failure?'FAIL':'PASS',journeyFailures,checks:checks.length,failed:checks.filter(x=>!x.ok).length,skips:0,backend:'synthetic HTTP fixture',independentQA:false});
 execFileSync('python3',[path.join(repo,'tests/v1d-public-site-readiness/guard.py'),'verify',repo,prepared,'after-run-' + path.basename(reserve)],{stdio:'inherit'});
}
if(failure)process.exitCode=1;
