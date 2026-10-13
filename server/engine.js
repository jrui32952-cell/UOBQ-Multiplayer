'use strict';
const crypto=require('node:crypto');
const TOTAL=100;
const random=(n)=>crypto.randomInt(n);
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=random(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function score(hands,caller){const sums=hands.map(h=>h.reduce((a,b)=>a+b,0));const success=sums[caller]<sums[1-caller];const points=[...sums];points[caller]=success?0:sums[caller]+10;return {sums,points,caller,success,winner:points[0]===points[1]?null:points[0]<points[1]?0:1};}
function createMatch(){return {players:[null,null],phase:'lobby',hands:[[],[]],face:[[],[]],deck:[],discard:[],turn:0,views:[[],[]],peeked:[[],[]],drawn:null,source:null,ability:null,selected:null,caller:null,finalTurns:0,scores:[0,0],history:[],winner:null,events:[],seq:0};}
function note(m,text,positions=[]){m.events.unshift({id:++m.seq,text,positions});m.events.length=Math.min(m.events.length,20);}
function startRound(m){if(m.phase==='match-end')throw Error('整场比赛已结束');if(!m.players.every(Boolean))throw Error('需要两位玩家');const deck=shuffle(Array.from({length:4},()=>Array.from({length:14},(_,i)=>i)).flat());m.hands=[[],[]];m.face=[[],[]];m.views=[[],[]];m.peeked=[[],[]];for(let i=0;i<4;i++)for(let p=0;p<2;p++){m.hands[p].push(deck.pop());m.face[p].push(false);}m.deck=deck;m.discard=[deck.pop()];m.turn=0;m.phase='memory';m.drawn=null;m.source=null;m.ability=null;m.selected=null;m.caller=null;m.finalTurns=0;m.winner=null;note(m,`第 ${m.history.length+1} 小局开始，双方依次查看两张暗牌`);}
function endRound(m){const r=score(m.hands,m.caller);m.scores=m.scores.map((v,i)=>v+r.points[i]);m.history.push({index:m.history.length+1,...r,total:[...m.scores]});note(m,`第 ${m.history.length} 小局结束：${r.success?'CABO 成功':'CABO 失败 (+10)'}`);if(m.scores.some(x=>x>=TOTAL)){m.phase='match-end';m.winner=m.scores[0]===m.scores[1]?null:m.scores[0]<m.scores[1]?0:1;note(m,`比赛结束：${m.winner===null?'平局':`玩家 ${m.winner+1} 获胜`}`);}else m.phase='round-end';}
function advance(m){m.drawn=null;m.source=null;m.ability=null;m.selected=null;if(m.caller!==null){m.finalTurns--;if(m.finalTurns===0){endRound(m);return;}}m.turn=1-m.turn;m.phase='turn';}
function validateSlot(i){if(!Number.isInteger(i)||i<0||i>3)throw Error('牌位必须为 1–4');}
function abilityOf(n){return n===7||n===8?'peek':n===9||n===10?'spy':n===11||n===12?'swap':null;}
function act(m,p,cmd){if(!m.players[p])throw Error('玩家未加入');if(!cmd||typeof cmd.type!=='string')throw Error('无效操作');if(m.phase==='round-end'&&cmd.type==='next'){if(p!==0)throw Error('只有房主能开始下一小局');startRound(m);return;}
if(m.phase==='lobby'&&cmd.type==='start'){if(p!==0)throw Error('只有房主能开局');startRound(m);return;}
if(m.phase==='match-end'&&cmd.type==='reset'){if(p!==0)throw Error('只有房主能重开');m.scores=[0,0];m.history=[];m.events=[];m.phase='lobby';startRound(m);return;}
if(m.phase==='memory'){if(cmd.type!=='memory')throw Error('请先查看开局暗牌');const i=cmd.index;validateSlot(i);if(m.peeked[p].includes(i))throw Error('这张已经查看过');if(m.peeked[p].length>=2)throw Error('已经查看两张');m.peeked[p].push(i);m.views[p][i]=m.hands[p][i];note(m,`玩家 ${p+1} 查看了自己的 #${i+1}`,[{player:p,index:i}]);if(m.peeked.every(a=>a.length===2)){m.phase='turn';m.turn=0;note(m,'记牌完成，玩家 1 先行动');}return;}
if(m.phase==='round-end'||m.phase==='match-end')throw Error('当前小局已经结束');
if(p!==m.turn)throw Error('还没轮到你');
if(m.phase==='turn'){
if(cmd.type==='cabo'){if(m.caller!==null)throw Error('已有人宣告 CABO');m.caller=p;m.finalTurns=2;note(m,`玩家 ${p+1} 宣告 CABO`);advance(m);return;}
if(cmd.type==='draw'){if(!m.deck.length){if(m.discard.length<=1)throw Error('牌堆已耗尽');const top=m.discard.pop();m.deck=shuffle(m.discard);m.discard=[top];}m.drawn=m.deck.pop();m.source='deck';m.phase='decision';note(m,`玩家 ${p+1} 从摸牌堆摸了一张牌`);return;}
if(cmd.type==='take'){if(!m.discard.length)throw Error('弃牌堆为空');m.drawn=m.discard.at(-1);m.source='discard';m.phase='decision';note(m,`玩家 ${p+1} 拿起弃牌堆的 ${m.drawn} 点明牌`);return;}
throw Error('请选择摸牌、明牌或 CABO');}
if(m.phase==='decision'){
if(cmd.type==='replace'){const i=cmd.index;validateSlot(i);const old=m.hands[p][i];if(m.source==='discard')m.discard.pop();m.hands[p][i]=m.drawn;m.face[p][i]=m.source==='discard';m.views[p][i]=m.drawn;m.discard.push(old);note(m,`玩家 ${p+1} 替换了自己的 #${i+1}${m.source==='discard'?'（新牌公开）':''}`,[{player:p,index:i}]);advance(m);return;}
if(m.source==='discard')throw Error('弃牌堆明牌只能用于换牌');
if(cmd.type==='discard'){m.discard.push(m.drawn);note(m,`玩家 ${p+1} 弃掉了 ${m.drawn} 点牌`);advance(m);return;}
if(cmd.type==='ability'){const kind=abilityOf(m.drawn);if(!kind)throw Error('不是技能牌');m.discard.push(m.drawn);m.drawn=null;m.source=null;m.ability=kind;m.phase='target';note(m,`玩家 ${p+1} 发动了 ${kind==='peek'?'偷看':kind==='spy'?'侦查':'交换'}`);return;}
throw Error('请选择换牌、弃牌或技能');}
if(m.phase==='target'){
if(m.ability==='peek'||m.ability==='spy'){if(cmd.type!=='target')throw Error('请选择要查看的牌');const i=cmd.index;validateSlot(i);const target=m.ability==='peek'?p:1-p;m.views[p][`${target}-${i}`]=m.hands[target][i];if(target===p)m.views[p][i]=m.hands[p][i];note(m,`玩家 ${p+1} ${m.ability==='peek'?'查看自己':'侦查对手'}的 #${i+1}`,[{player:target,index:i}]);advance(m);return;}
if(m.ability==='swap'){
if(cmd.type==='select'){const i=cmd.index;validateSlot(i);m.selected=i;note(m,`玩家 ${p+1} 选择自己的 #${i+1} 准备交换`,[{player:p,index:i}]);return;}
if(cmd.type==='target'&&m.selected!==null){const i=cmd.index;validateSlot(i);const a=m.selected,q=1-p;[m.hands[p][a],m.hands[q][i]]=[m.hands[q][i],m.hands[p][a]];[m.face[p][a],m.face[q][i]]=[m.face[q][i],m.face[p][a]];for(let viewer=0;viewer<2;viewer++){delete m.views[viewer][a];delete m.views[viewer][i];delete m.views[viewer][`${p}-${a}`];delete m.views[viewer][`${q}-${i}`];}for(let owner=0;owner<2;owner++)for(let k=0;k<4;k++)if(m.face[owner][k])for(let viewer=0;viewer<2;viewer++)m.views[viewer][`${owner}-${k}`]=m.hands[owner][k];note(m,`玩家 ${p+1} 交换了自己的 #${a+1} ↔ 对手 #${i+1}`,[{player:p,index:a},{player:q,index:i}]);advance(m);return;}
throw Error('先选自己的牌，再选对手牌');}
}
throw Error('操作不适用于当前阶段');}
function view(m,p){return {player:p,players:m.players.map(x=>x?{name:x.name,connected:x.connected}:null),phase:m.phase,turn:m.turn,hands:m.hands.map((h,owner)=>h.map((n,i)=>({index:i,faceUp:m.face[owner][i],value:m.phase==='round-end'||m.phase==='match-end'||m.face[owner][i]?n:owner===p?(m.views[p][i]??null):(m.views[p][`${owner}-${i}`]??null),hidden:!(m.face[owner][i]||m.phase==='round-end'||m.phase==='match-end'||(owner===p&&m.views[p][i]!==undefined)||(m.views[p][`${owner}-${i}`]!==undefined))}))),discard:m.discard.at(-1)??null,deckCount:m.deck.length,drawn:m.turn===p?m.drawn:m.source==='discard'?m.drawn:null,drawSource:m.turn===p?m.source:null,otherDrawing:m.phase==='decision'&&m.turn!==p,ability:m.turn===p?m.ability:null,selected:m.turn===p?m.selected:null,peeked:m.peeked.map(x=>[...x]),caller:m.caller,scores:[...m.scores],history:m.history,round:m.history.length+1,events:m.events.slice(0,9),winner:m.winner,goal:TOTAL};}
module.exports={createMatch,startRound,act,view,score};
