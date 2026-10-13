'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createMatch,act,view}=require('./engine');
const PORT=process.env.PORT||3000, PUBLIC=path.resolve(__dirname,'../public');
const rooms=new Map();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
function fail(res,status,error){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify({error}));}
function json(res,data){res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));}
function roomCode(){let code;do{code=crypto.randomBytes(4).toString('hex').slice(0,6).toUpperCase();}while(rooms.has(code));return code;}
function publish(room){for(const [token,stream] of room.clients){const p=room.tokens.get(token);try{stream.write(`event: state\ndata: ${JSON.stringify(view(room.match,p))}\n\n`);}catch{room.clients.delete(token);}}}
function cleanRooms(){const now=Date.now();for(const [code,r] of rooms)if(now-r.lastSeen>24*60*60*1000){for(const res of r.clients.values())res.end();rooms.delete(code);}}
setInterval(cleanRooms,60*60*1000).unref();
async function body(req){let data='';for await(const chunk of req){data+=chunk;if(data.length>8192)throw Error('请求过大');}return data?JSON.parse(data):{};}
function auth(data){const room=rooms.get(String(data.code||'').toUpperCase());if(!room)throw Error('房间不存在或已过期');const p=room.tokens.get(data.token);if(p===undefined)throw Error('无效房间凭证');room.lastSeen=Date.now();return {room,p};}
const server=http.createServer(async(req,res)=>{
try{
const u=new URL(req.url,'http://localhost');
if(req.method==='GET'&&u.pathname==='/healthz')return json(res,{ok:true,service:'uobq-multiplayer'});
if(req.method==='POST'&&u.pathname==='/api/create'){
 const b=await body(req),code=roomCode(),token=crypto.randomBytes(20).toString('hex'),room={match:createMatch(),tokens:new Map([[token,0]]),clients:new Map(),lastSeen:Date.now()};room.match.players[0]={name:String(b.name||'玩家 1').slice(0,18),connected:true};rooms.set(code,room);return json(res,{code,token,player:0});
}
if(req.method==='POST'&&u.pathname==='/api/join'){
 const b=await body(req),room=rooms.get(String(b.code||'').toUpperCase());if(!room)throw Error('房间不存在');if(room.match.players[1])throw Error('房间已满');const token=crypto.randomBytes(20).toString('hex');room.tokens.set(token,1);room.match.players[1]={name:String(b.name||'玩家 2').slice(0,18),connected:true};room.lastSeen=Date.now();publish(room);return json(res,{code:String(b.code).toUpperCase(),token,player:1});
}
if(req.method==='GET'&&u.pathname==='/api/events'){
 const {room,p}=auth({code:u.searchParams.get('code'),token:u.searchParams.get('token')});room.match.players[p].connected=true;
 res.writeHead(200,{'content-type':'text/event-stream; charset=utf-8','cache-control':'no-cache, no-transform','connection':'keep-alive','x-accel-buffering':'no'});
 room.clients.set(u.searchParams.get('token'),res);res.write(`event: state\ndata: ${JSON.stringify(view(room.match,p))}\n\n`);
 const ping=setInterval(()=>{try{res.write(': ping\n\n');}catch{}},18000);
 res.on('close',()=>{clearInterval(ping);if(room.clients.get(u.searchParams.get('token'))===res)room.clients.delete(u.searchParams.get('token'));room.match.players[p].connected=false;publish(room);});return;
}
if(req.method==='POST'&&u.pathname==='/api/action'){
 const b=await body(req),{room,p}=auth(b);act(room.match,p,b.action);publish(room);return json(res,{ok:true});
}
if(req.method==='GET'){
 const pathname=u.pathname==='/'?'/index.html':u.pathname;const file=path.resolve(PUBLIC,'.'+decodeURIComponent(pathname));if(!(file===PUBLIC||file.startsWith(PUBLIC+path.sep)))return fail(res,403,'访问被拒绝');
 const st=fs.existsSync(file)?fs.statSync(file):null;if(!st||!st.isFile())return fail(res,404,'页面不存在');res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});return fs.createReadStream(file).pipe(res);
}
fail(res,404,'未找到接口');
}catch(e){fail(res,400,e.message||'未知错误');}
});
if(require.main===module)server.listen(PORT,()=>console.log(`UOBQ multiplayer running on http://localhost:${PORT}`));
module.exports=server;
