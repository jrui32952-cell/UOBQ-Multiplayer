'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');const server=require('../server/server');
test('HTTP two-player create/join/live stream and action authorization',async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const post=async (path,data)=>{const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});return {status:r.status,data:await r.json()};};
 let stream;
 try{
  const a=(await post('/api/create',{name:'房主'})).data;assert.equal(a.code.length,6);
  const b=(await post('/api/join',{code:a.code,name:'朋友'})).data;assert.equal(b.player,1);
  assert.equal((await post('/api/action',{...b,action:{type:'start'}})).status,400);
  assert.equal((await post('/api/action',{...a,action:{type:'start'}})).status,200);
  stream=await fetch(`${base}/api/events?code=${a.code}&token=${a.token}`);assert.equal(stream.status,200);
  const reader=stream.body.getReader();const first=await reader.read();const msg=new TextDecoder().decode(first.value);assert.match(msg,/event: state/);assert.match(msg,/"phase":"memory"/);
  await reader.cancel();assert.equal((await post('/api/action',{code:a.code,token:'fake',action:{type:'draw'}})).status,400);
 }finally{stream?.body?.cancel().catch(()=>{});await new Promise(r=>server.close(r));}
});
