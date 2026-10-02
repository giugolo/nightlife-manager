import { spawn, spawnSync } from 'node:child_process';
import { createWriteStream, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
mkdirSync(`${root}.runtime`, {recursive:true});
const log = createWriteStream(`${root}.runtime/shutdown.log`);
const child = spawn(process.execPath, ['scripts/dev.mjs'], {cwd:root,env:process.env,stdio:['ignore','pipe','pipe']});
child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms));
let javaPID;
let ownedJava=false;
try {
  let info;
  for(let i=0;i<120;i++) {
    if(child.exitCode !== null)throw Error(`Our dev runner exited: ${child.exitCode}`);
    try {info=await (await fetch('http://127.0.0.1:4400/emulators')).json();if(info.firestore?.pid)break;}catch { /* waiting for our hub */ }
    await pause(250);
  }
  assert.ok(info?.firestore?.pid,'Our Firestore must be ready');
  javaPID=info.firestore.pid;
  const parentOf = pid => Number(spawnSync('ps',['-o','ppid=','-p',String(pid)],{encoding:'utf8'}).stdout.trim());
  const launcherPID=parentOf(javaPID);
  assert.ok(launcherPID > 1,'Java parent must exist');
  assert.equal(parentOf(launcherPID),child.pid,'Java must be a direct descendant of our own dev runner');
  ownedJava=true;
  process.kill(javaPID,'SIGSTOP');
  const finished=new Promise(resolve=>child.once('exit',resolve));
  child.kill('SIGINT');
  await Promise.race([finished,pause(12000).then(()=>{throw Error('Shutdown timeout');})]);
  let alive=true;
  try {process.kill(javaPID,0);}catch {alive=false;}
  assert.equal(alive,false,'Suspended owned Java must not survive runner shutdown');
  console.log('PASS: suspended owned Java cleaned up');
} finally {
  if(ownedJava){try{process.kill(javaPID,'SIGKILL');}catch{/* already exited */}}
  if(child.exitCode===null)child.kill('SIGTERM');
  child.stdout.unpipe(log);
  child.stderr.unpipe(log);
  log.end();
}
