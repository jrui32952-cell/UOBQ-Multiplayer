'use strict';
const $ = id => document.getElementById(id);
const E = {
  status:$('status'), turnCaption:$('turnCaption'), aiBadge:$('aiBadge'), playerBadge:$('playerBadge'),
  aiCards:$('aiCards'), playerCards:$('playerCards'), draw:$('drawDeck'), discard:$('discardPile'), deckCount:$('deckCount'),
  discardWrap:$('discardWrap'), drawWrap:$('drawWrap'), drawn:$('drawnSlot'), discardDrawn:$('discardDrawn'), useAbility:$('useAbility'),
  callCabo:$('callCabo'), helper:$('helper'), overlay:$('gameOverlay'), aiArea:$('aiArea'), playerArea:$('playerArea'),
  centerArea:$('centerArea'), countdown:$('countdownOverlay'), countdownNumber:$('countdownNumber'), countdownText:$('countdownText'),
  flash:$('actionFlash'), flashTitle:$('flashTitle'), flashBody:$('flashBody'), log:$('publicLog'), logPanel:$('logPanel')
};
const MATCH_KEY='uobq-match-v1';
const newMatch=()=>({id:Date.now(),startedAt:new Date().toISOString(),totals:[0,0],rounds:[],finished:false,winner:null});
function restoreMatch(){
  try{const saved=JSON.parse(localStorage.getItem(MATCH_KEY));
    if(saved&&Array.isArray(saved.history)&&saved.active&&Array.isArray(saved.active.rounds)&&Array.isArray(saved.active.totals))return saved;
  }catch(error){console.warn('战绩无法读取，使用临时记录',error);}
  return {active:newMatch(),history:[]};
}
let matchData=restoreMatch();
function saveMatch(){try{localStorage.setItem(MATCH_KEY,JSON.stringify(matchData));}catch(error){console.warn('战绩暂时无法保存',error);}}
function matchWinner(totals){return totals[0]===totals[1]?null:(totals[0]<totals[1]?0:1);}
function matchSummary(){
  const m=matchData.active;
  $('scorePill').textContent=`你 ${m.totals[0]} / 电脑 ${m.totals[1]} · 目标100`;
}
function ensureNewMatch(){
  const prev=matchData.active;
  if(prev.rounds.length){matchData.history.unshift({...prev,finished:prev.finished,endedAt:new Date().toISOString(),winner:prev.finished?prev.winner:matchWinner(prev.totals),abandoned:!prev.finished});matchData.history=matchData.history.slice(0,30);}
  matchData.active=newMatch();saveMatch();matchSummary();
}
function addRound(result){
  const m=matchData.active;
  if(m.finished)return;
  m.rounds.push({no:m.rounds.length+1,at:new Date().toISOString(),sums:[...result.sums],scores:[...result.scores],caboBy:result.caboBy,success:result.success,penalty:result.penalty,winner:result.winner});
  m.totals=m.totals.map((n,i)=>n+result.scores[i]);
  if(m.totals.some(n=>n>=100)){m.finished=true;m.winner=matchWinner(m.totals);m.endedAt=new Date().toISOString();}
  saveMatch();matchSummary();
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function rowMarkup(round){
  const caller=round.caboBy===0?'你':'电脑';const outcome=round.winner===null?'平局':round.winner===0?'你胜':'电脑胜';
  const effect=round.success?'成功 · 宣告者记 0':`失败 · 宣告者 +${round.penalty}`;
  return `<tr><td>#${round.no}</td><td>${esc(outcome)}</td><td>${round.sums[0]} → <b>${round.scores[0]}</b></td><td>${round.sums[1]} → <b>${round.scores[1]}</b></td><td>${caller} CABO<br><small>${effect}</small></td></tr>`;
}
function renderRecap(){
  const m=matchData.active;
  const leader=m.winner===null?'平局':m.winner===0?'你获胜':'电脑获胜';
  const ongoing=m.finished?`本场已结束 · ${leader}`:`正在进行第 ${m.rounds.length+1} 小局`;
  const history=matchData.history.length?matchData.history.map((old,i)=>{
    const who=old.winner===null?'平局':old.winner===0?'你胜':'电脑胜';
    return `<details class="past-match"><summary>第 ${matchData.history.length-i} 场 · ${esc(who)} · ${old.totals[0]} : ${old.totals[1]} <span>${old.abandoned?'提前结束':'已结算'}</span></summary><div class="recap-table-scroll"><table class="recap-table"><thead><tr><th>小局</th><th>结果</th><th>你（原始→结算）</th><th>电脑（原始→结算）</th><th>CABO</th></tr></thead><tbody>${old.rounds.map(rowMarkup).join('')}</tbody></table></div></details>`;
  }).join(''):'<p class="recap-empty">暂无之前整场比赛的记录。</p>';
  $('recapContent').innerHTML=`<div class="recap-state">${esc(ongoing)}</div>
  <div class="recap-stats"><div><span>你的累计扣分</span><strong>${m.totals[0]}</strong><small>${Math.max(0,100-m.totals[0])} 分到达 100</small></div><div><span>电脑累计扣分</span><strong>${m.totals[1]}</strong><small>${Math.max(0,100-m.totals[1])} 分到达 100</small></div></div>
  <div class="recap-progress"><div><span>你</span><div class="meter"><i style="width:${Math.min(100,m.totals[0])}%"></i></div></div><div><span>电脑</span><div class="meter"><i style="width:${Math.min(100,m.totals[1])}%"></i></div></div></div>
  <h3>本场小局记录</h3><div class="recap-table-scroll"><table class="recap-table"><thead><tr><th>小局</th><th>结果</th><th>你（原始→结算）</th><th>电脑（原始→结算）</th><th>CABO</th></tr></thead><tbody>${m.rounds.length?m.rounds.map(rowMarkup).join(''):'<tr><td colspan="5">当前尚无已完成的小局</td></tr>'}</tbody></table></div>
  ${m.finished?'<button class="recap-new-match control primary" id="recapNewMatch" type="button">新建比赛（累计分清零）</button>':''}
  <h3>之前整场比赛</h3><div class="past-list">${history}</div><p class="recap-rule">累计分越低越好。一方到达 100 分或以上，本场结束，累计分较低者获胜。战绩仅保存在当前浏览器。</p>`;
  const newMatchButton=$('recapNewMatch');
  if(newMatchButton)newMatchButton.addEventListener('click',()=>{ensureNewMatch();setup();});
}
function openRecap(){renderRecap();$('recapOverlay').hidden=false;}
function closeRecap(){$('recapOverlay').hidden=true;}
function nextRound(){if(matchData.active.finished){openRecap();return;}setup();}

let state;
let countdownTimer=null,flashTimer=null,aiTimer=null,aiEndTimer=null,memoryTimer=null,sessionId=0, motionBusy=false;
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const skill=n=>n===7||n===8?'偷看':n===9||n===10?'侦查':n===11||n===12?'交换':null;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const keyOf=(owner,index)=>`${owner}-${index}`;

function setup(){
  clearTimeout(countdownTimer); clearTimeout(flashTimer); clearTimeout(aiTimer); clearTimeout(aiEndTimer); clearTimeout(memoryTimer);
  sessionId++; motionBusy=false; document.querySelectorAll('.motion-card').forEach(n=>n.remove());
  const deck=shuffle(Array.from({length:4},()=>Array.from({length:14},(_,i)=>i)).flat());
  state={
    deck, discard:[], hands:[[],[]], faceUp:[[],[]], knowledge:[{},{}], drawSource:null,
    phase:'countdown', turn:0, drawn:null, ability:null, peekCount:0, caboBy:null, finalLeft:0,
    memoryVisible:null, peekShown:null, spyShown:null, swapFrom:null, logs:[], recentMarks:[], aiInitialPeek:[]
  };
  for(let k=0;k<4;k++){state.hands[0].push(deck.pop());state.hands[1].push(deck.pop());state.faceUp[0].push(false);state.faceUp[1].push(false);}
  state.discard.push(deck.pop());
  const aiChoices=shuffle([0,1,2,3]).slice(0,2).sort((a,b)=>a-b);
  state.aiInitialPeek=aiChoices;
  aiChoices.forEach(i=>{state.knowledge[1][i]=state.hands[1][i];});
  state.logs=['新的一局开始。','电脑已查看自己的 #'+(aiChoices[0]+1)+' 与 #'+(aiChoices[1]+1)+'。'];
  state.recentMarks=aiChoices.map(i=>keyOf(1,i));
  hideDialog(); closeRecap(); matchSummary();
  if(matchData.active.finished){
    state.phase='done';
    state.hands=[[],[]];
    message('上一场比赛已结束，请查看战绩并新建比赛。');
    E.aiCards.replaceChildren(); E.playerCards.replaceChildren();
    E.draw.disabled=true; E.callCabo.disabled=true;
    openRecap();
    return;
  }
  message('准备开局……');
  render();
  startCountdown();
  animateDeal();
}

function message(s){E.status.textContent=s;}
function setRecentMarks(items=[]){state.recentMarks=items.map(({owner,index})=>keyOf(owner,index));}
function logEvent(text,marks=[]){state.logs.unshift(text);state.logs=state.logs.slice(0,7);setRecentMarks(marks);renderLog();}
function renderLog(){E.log.replaceChildren(...state.logs.map((line,idx)=>{const li=document.createElement('li');li.innerHTML=(idx===0?'<strong>最新：</strong>':'')+line;return li;}));}

function startCountdown(){
  E.countdown.hidden=false; E.countdownText.textContent='3 秒后开始记牌'; E.countdownNumber.textContent='3';
  const thisSession=sessionId; const begin=performance.now();
  function tick(){
    if(thisSession!==sessionId)return;
    const elapsed=performance.now()-begin;
    if(elapsed>=3000){
      E.countdownNumber.textContent='GO'; E.countdownText.textContent='请记住你的两张暗牌';
      countdownTimer=setTimeout(()=>{ if(thisSession!==sessionId)return; E.countdown.hidden=true; state.phase='memory'; message('开局：请选择你的两张暗牌查看。'); flashAction('开局记牌','你与电脑都知道彼此查看的是哪两个位置'); render(); },360);
      return;
    }
    E.countdownNumber.textContent=String(3-Math.floor(elapsed/1000));
    countdownTimer=setTimeout(tick,Math.min(100,3000-elapsed));
  }
  tick();
}

function flashAction(title,body){
  clearTimeout(flashTimer); E.flashTitle.textContent=title; E.flashBody.textContent=body; E.flash.hidden=false;
  flashTimer=setTimeout(()=>{E.flash.hidden=true;},1200);
}

function targetCard(owner,index){return (owner===0?E.playerCards:E.aiCards).children[index]?.querySelector('.game-card')||null;}
function cardElement(value,{reveal=false,click=null,label='',memory=false,pop=false,drawn=false}={}){
  const el=document.createElement(click?'button':'div');
  el.className='game-card '+(reveal?'face':'back')+(memory?' memory':'')+(pop?' reveal-pop':'')+(drawn?' drawn-enter':'');
  const img=document.createElement('img'); img.className='card-art'; img.draggable=false;
  img.src=reveal?`assets/cards/card-${String(value).padStart(2,'0')}.png`:'assets/cards/card-back.svg';
  img.alt=reveal?`点数 ${value}${skill(value)?'，'+skill(value):''}`:'盖住的卡牌'; el.appendChild(img);
  if(click){el.type='button';el.addEventListener('click',click);el.setAttribute('aria-label',label||'卡牌');}
  return el;
}
function slotWrapper(owner,index,card,opts={}){
  const wrap=document.createElement('div'); wrap.className='card-slot';
  if(opts.selectable)wrap.classList.add('selectable');
  if(state.recentMarks.includes(keyOf(owner,index)))wrap.classList.add('recent');
  if(opts.publicTarget)wrap.classList.add('public-target');
  const badgeText=state.faceUp[owner][index]?'明牌':opts.memoryMark?'已查看':'';
  if(badgeText){const badge=document.createElement('div'); badge.className='slot-badge'+(state.faceUp[owner][index]?' faceup':''); badge.textContent=badgeText; wrap.appendChild(badge);}
  const label=document.createElement('div'); label.className='slot-index'; label.textContent='#'+(index+1);
  wrap.append(card,label); return wrap;
}

async function flyCard(from,to,value,{face=false,duration=580,turn=false}={}){
  if(!from||!to||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const start=from.getBoundingClientRect(),end=to.getBoundingClientRect(); if(!start.width||!end.width)return;
  const ghost=cardElement(value,{reveal:face}); ghost.classList.add('motion-card');
  ghost.style.left=start.left+'px'; ghost.style.top=start.top+'px'; ghost.style.width=start.width+'px'; ghost.style.height=start.height+'px';
  document.body.appendChild(ghost);
  const dx=end.left-start.left, dy=end.top-start.top, sx=end.width/start.width, sy=end.height/start.height;
  try{ await ghost.animate([
    {transform:'translate(0,0) scale(1) rotate(-3deg)',opacity:.86},
    {transform:`translate(${dx*.5}px,${dy*.5-20}px) scale(${(1+sx)/2},${(1+sy)/2}) rotate(${turn?8:4}deg)`,opacity:1,offset:.55},
    {transform:`translate(${dx}px,${dy}px) scale(${sx},${sy}) rotate(0deg)`,opacity:1}
  ],{duration,easing:'cubic-bezier(.2,.75,.2,1)'}).finished;}catch(e){}
  ghost.remove();
}
async function animateDeal(){
  const id=sessionId;
  const jobs=[];
  for(let i=0;i<4;i++){jobs.push({to:targetCard(1,i),delay:i*90});jobs.push({to:targetCard(0,i),delay:i*90+120});}
  await Promise.all(jobs.map(async j=>{await sleep(j.delay); if(id!==sessionId)return; await flyCard(E.draw,j.to,null,{duration:420}); }));
}
async function transaction(work){
  if(motionBusy)return; motionBusy=true; document.querySelector('.table-main').classList.add('is-animating');
  const id=sessionId; try{await work(id);} finally {if(id===sessionId){motionBusy=false; document.querySelector('.table-main').classList.remove('is-animating'); render();}}
}

function applyFocus(){
  [E.aiArea,E.playerArea,E.centerArea,E.logPanel].forEach(el=>el.classList.remove('dimmed','spotlight'));
  if(state.phase==='countdown'||state.phase==='done')return;
  if(state.phase==='memory'||state.phase==='memoryReveal'){E.aiArea.classList.add('dimmed');E.centerArea.classList.add('dimmed');E.logPanel.classList.add('spotlight');E.playerArea.classList.add('spotlight');return;}
  if(state.phase==='turn'){E.aiArea.classList.add('dimmed');E.logPanel.classList.add('spotlight');E.playerArea.classList.add('spotlight');E.centerArea.classList.add('spotlight');return;}
  if(state.phase==='decision'){E.aiArea.classList.add('dimmed');E.playerArea.classList.add('spotlight');E.centerArea.classList.add('spotlight');E.logPanel.classList.add('spotlight');return;}
  if(state.phase==='target'){
    E.logPanel.classList.add('spotlight');
    if(state.ability==='peek'||state.ability==='swap1'){E.aiArea.classList.add('dimmed');E.centerArea.classList.add('dimmed');E.playerArea.classList.add('spotlight');}
    else{E.playerArea.classList.add('dimmed');E.centerArea.classList.add('dimmed');E.aiArea.classList.add('spotlight');}
    return;
  }
  if(state.phase==='ai'){E.playerArea.classList.add('dimmed');E.aiArea.classList.add('spotlight');E.centerArea.classList.add('spotlight');E.logPanel.classList.add('spotlight');}
}

function render(){
  const canTargetAI = state.phase==='target'&&(state.ability==='spy'||state.ability==='swap2');
  const canTargetSelf = state.phase==='memory'||state.phase==='decision'||(state.phase==='target'&&(state.ability==='peek'||state.ability==='swap1'));

  E.aiCards.replaceChildren(...state.hands[1].map((n,i)=>{
    const reveal = state.faceUp[1][i]||state.phase==='done'||state.spyShown===i;
    const card = cardElement(n,{reveal,click:canTargetAI?()=>chooseOpponentCard(i):null,label:'电脑第'+(i+1)+'张牌'});
    return slotWrapper(1,i,card,{selectable:canTargetAI,publicTarget:state.aiInitialPeek.includes(i)});
  }));

  E.playerCards.replaceChildren(...state.hands[0].map((n,i)=>{
    const reveal = state.faceUp[0][i]||state.phase==='done'||((state.phase==='memory'||state.phase==='memoryReveal')&&state.memoryVisible===i)||state.peekShown===i;
    const card = cardElement(n,{reveal,click:canTargetSelf?()=>chooseCard(i):null,label:'你的第'+(i+1)+'张牌',memory:(state.phase==='memory'||state.phase==='memoryReveal')&&state.memoryVisible===i,pop:state.peekShown===i||state.memoryVisible===i});
    return slotWrapper(0,i,card,{selectable:canTargetSelf,publicTarget:false,memoryMark:Object.prototype.hasOwnProperty.call(state.knowledge[0],i)&&!state.faceUp[0][i]&&state.phase.startsWith('memory')});
  }));

  E.discard.replaceChildren(cardElement(state.discard.at(-1),{reveal:true,pop:true}));
  E.discard.classList.toggle('takeable',state.phase==='turn'&&state.turn===0&&!motionBusy);
  E.discard.setAttribute('role','button'); E.discard.setAttribute('tabindex',state.phase==='turn'&&state.turn===0?'0':'-1');
  E.discard.setAttribute('aria-label','从弃牌堆拿起最上方的明牌');
  E.discardWrap.classList.toggle('selectable',state.phase==='turn'&&state.turn===0&&!motionBusy);
  E.drawWrap.classList.toggle('selectable',state.phase==='turn'&&state.turn===0&&!motionBusy);

  E.deckCount.textContent = state.deck.length+' 张剩余';
  E.drawn.replaceChildren(...(state.drawn===null?[]:[cardElement(state.drawn,{reveal:true,drawn:true})]));
  E.discardDrawn.hidden = state.phase!=='decision'||state.drawSource==='discard';
  E.useAbility.hidden = state.phase!=='decision'||state.drawSource==='discard'||!skill(state.drawn);
  E.useAbility.textContent = state.drawn===null?'使用能力':'使用「'+skill(state.drawn)+'」';
  E.callCabo.disabled = motionBusy || state.phase!=='turn'||state.turn!==0||state.caboBy!==null;
  E.draw.disabled = motionBusy || state.phase!=='turn'||state.turn!==0;
  E.aiBadge.textContent = state.turn===1&&state.phase!=='done'?'行动中':'电脑';
  E.playerBadge.textContent = state.phase==='countdown'?'准备中':(state.phase==='memory'||state.phase==='memoryReveal')?'记两张':state.turn===0&&state.phase!=='done'?'你的回合':'等待';
  E.playerBadge.classList.toggle('current',state.turn===0&&state.phase!=='done'&&state.phase!=='countdown');
  E.aiBadge.classList.toggle('current',state.turn===1&&state.phase!=='done');

  E.turnCaption.textContent = state.phase==='countdown'?'准备开始':(state.phase==='memory'||state.phase==='memoryReveal')?'选择两张自己的牌查看':state.phase==='decision'?(state.drawSource==='discard'?'请选择一张手牌，用明牌替换':'请选择：换牌、弃牌或使用能力'):state.phase==='target'?(state.ability==='peek'?'请选择自己的一个牌位':state.ability==='spy'?'请选择电脑的一个牌位':'请选择交换涉及的牌位'):state.phase==='turn'?'轮到你：摸牌或拿弃牌堆明牌':state.phase==='ai'?'电脑正在行动':'本局已结束';
  E.helper.textContent = state.phase==='countdown'?'固定牌位从左到右是 #1–#4。':(state.phase==='memory'||state.phase==='memoryReveal')?'双方都知道彼此查看的是哪几个位置，但不知道数值。':state.phase==='decision'?(state.drawSource==='discard'?'这张明牌换进去后会持续公开，且不能发动技能。':'摸牌堆抽到技能牌时，可以弃掉并发动能力。'):state.phase==='target'?(state.ability==='peek'?'公开信息：所有玩家都知道你查看了哪个位置。':state.ability==='spy'?'公开信息：所有玩家都知道你侦查了电脑的哪个位置。':'交换完成后，双方都知道交换发生在哪两个位置。'):state.phase==='turn'?'你可以点击摸牌堆，或直接点击弃牌堆最上方明牌。':state.phase==='ai'?'请观察电脑操作的是第几个固定牌位。':'';
  renderLog();
  applyFocus();
}

function nextTurn(){
  state.drawn=null; state.drawSource=null; state.peekShown=null; state.spyShown=null; state.ability=null; state.swapFrom=null;
  if(state.caboBy!==null){state.finalLeft--; if(state.finalLeft<=0){finish();return;}}
  state.turn=1-state.turn; state.phase=state.turn===0?'turn':'ai'; render();
  if(state.turn===1){ flashAction('电脑回合','请观察电脑操作的是哪个位置'); const thisSession=sessionId; aiTimer=setTimeout(()=>{if(thisSession===sessionId)aiTurn();},820); }
  else { message('轮到你了！'); flashAction('你的回合','点击摸牌堆或弃牌堆开始操作'); }
}

function chooseCard(i){
  if(motionBusy)return;
  if(state.phase==='memory'){
    if(Object.prototype.hasOwnProperty.call(state.knowledge[0],i))return;
    state.knowledge[0][i]=state.hands[0][i]; state.peekCount++; state.memoryVisible=i; state.phase='memoryReveal';
    const thisSession=sessionId;
    logEvent(`你查看了自己的 #${i+1}。`,[{owner:0,index:i}]);
    message('请记住第 '+(i+1)+' 张牌的点数：'+state.hands[0][i]); render(); flashAction('记住这张牌',`你查看了 #${i+1}`);
    clearTimeout(memoryTimer); memoryTimer=setTimeout(()=>{ if(thisSession!==sessionId)return; state.memoryVisible=null; if(state.peekCount===2){state.phase='turn'; message('记牌完成，轮到你摸牌或宣告 CABO。'); flashAction('记牌完成','现在开始正式回合');} else {state.phase='memory'; message('再选择一张尚未看过的暗牌。');} render(); },1150);
    return;
  }
  if(state.turn!==0)return;
  if(state.phase==='decision'){
    const newValue=state.drawn, oldValue=state.hands[0][i], fromDiscard=state.drawSource==='discard';
    const oldCard=targetCard(0,i); const sourceEl=fromDiscard?E.discard:E.drawn.firstElementChild;
    transaction(async id=>{
      flashAction('正在换牌','新牌飞入对应位置');
      await flyCard(sourceEl,oldCard,newValue,{face:true,duration:520}); if(id!==sessionId)return;
      await flyCard(oldCard,E.discard,oldValue,{face:true,duration:480}); if(id!==sessionId)return;
      if(fromDiscard)state.discard.pop();
      state.hands[0][i]=newValue; state.faceUp[0][i]=fromDiscard; state.knowledge[0][i]=newValue; state.discard.push(oldValue);
      logEvent(fromDiscard?`你用弃牌堆明牌替换了自己的 #${i+1}。`:`你替换了自己的 #${i+1}。`,[{owner:0,index:i}]);
      message('换牌成功！'); nextTurn();
    });
    return;
  }
  if(state.phase==='target'&&state.ability){
    if(state.ability==='peek'){
      state.knowledge[0][i]=state.hands[0][i]; state.peekShown=i; logEvent(`你偷看了自己的 #${i+1}。`,[{owner:0,index:i}]); render();
      showDialog('偷看结果','第 '+(i+1)+' 张牌的点数是 '+state.hands[0][i]+'。',[['记住了',()=>{hideDialog(); flashAction('偷看完成','请记住这张牌'); nextTurn();}]]);
    } else if(state.ability==='swap1'){
      state.swapFrom=i; state.ability='swap2'; logEvent(`你选择了自己的 #${i+1}，准备交换。`,[{owner:0,index:i}]); message('点击电脑的一张暗牌进行交换。'); flashAction('开始交换','现在请选择电脑的一张牌'); render();
    }
  }
}

function chooseOpponentCard(i){
  if(motionBusy||state.phase!=='target')return;
  if(state.ability==='spy'){
    state.spyShown=i; logEvent(`你侦查了电脑的 #${i+1}。`,[{owner:1,index:i}]); render();
    showDialog('侦查结果','电脑第 '+(i+1)+' 张牌的点数是 '+state.hands[1][i]+'。',[['记住了',()=>{hideDialog(); state.spyShown=null; nextTurn();}]]);
  } else if(state.ability==='swap2'){
    const a=state.swapFrom,left=targetCard(0,a),right=targetCard(1,i);
    transaction(async id=>{
      flashAction('交换中','双方都能看到交换的是哪两个位置');
      await Promise.all([flyCard(left,right,null,{duration:700,turn:true}),flyCard(right,left,null,{duration:700,turn:true})]); if(id!==sessionId)return;
      [state.hands[0][a],state.hands[1][i]]=[state.hands[1][i],state.hands[0][a]];
      [state.faceUp[0][a],state.faceUp[1][i]]=[state.faceUp[1][i],state.faceUp[0][a]];
      delete state.knowledge[0][a]; delete state.knowledge[1][i];
      if(state.faceUp[0][a])state.knowledge[0][a]=state.hands[0][a]; if(state.faceUp[1][i])state.knowledge[1][i]=state.hands[1][i];
      logEvent(`你交换了 你的 #${a+1} ↔ 电脑 #${i+1}。`,[{owner:0,index:a},{owner:1,index:i}]);
      message('交换完成！'); nextTurn();
    });
  }
}

function takeDiscard(){
  if(motionBusy||state.phase!=='turn'||state.turn!==0||!state.discard.length)return;
  state.drawn=state.discard.at(-1); state.drawSource='discard'; state.phase='decision';
  message('拿起弃牌堆的 '+state.drawn+' 点明牌，请选择一张自己的牌替换。'); flashAction('使用弃牌堆明牌','替换后的新牌将保持公开'); render();
}

function draw(){
  if(motionBusy||state.phase!=='turn'||state.turn!==0)return;
  if(!state.deck.length)recycle(); if(state.phase==='done'||!state.deck.length)return;
  const picked=state.deck.pop(); state.phase='animating'; render();
  transaction(async id=>{ await flyCard(E.draw,E.drawn,picked,{face:false}); if(id!==sessionId)return; state.drawn=picked; state.drawSource='deck'; state.phase='decision'; render(); message('你摸到了 '+state.drawn+(skill(state.drawn)?' · '+skill(state.drawn):'')+'。'); flashAction('你摸到 '+state.drawn, skill(state.drawn)?'这是一张「'+skill(state.drawn)+'」牌':'请决定换牌还是弃掉'); });
}
function recycle(){ if(state.discard.length<=1){finish();return;} const top=state.discard.pop(); state.deck=shuffle(state.discard); state.discard=[top]; }

function useAbility(){
  if(state.phase!=='decision'||state.drawSource==='discard')return; const name=skill(state.drawn); if(!name)return;
  state.discard.push(state.drawn); state.drawn=null; state.phase='target'; state.ability=name==='偷看'?'peek':name==='侦查'?'spy':'swap1';
  logEvent(`你弃掉了一张「${name}」牌并开始发动能力。`,[]);
  message(name==='偷看'?'点击一张自己的暗牌。':name==='侦查'?'点击电脑的一张暗牌。':'先点击自己的一张暗牌。');
  flashAction('使用能力', name==='偷看'?'请选择自己的一张牌':name==='侦查'?'请选择电脑的一张牌':'先选自己，再选电脑'); render();
}

async function aiTurn(){
  if(state.phase!=='ai')return; if(!state.deck.length)recycle(); if(state.phase==='done'||!state.deck.length)return;
  const thisAiSession=sessionId; const hand=state.hands[1], known=state.knowledge[1];
  const candidates=hand.map((n,i)=>({i,score:known[i]??(state.faceUp[1][i]?n:7)})).sort((a,b)=>b.score-a.score); const target=candidates[0];
  const discardTop=state.discard.at(-1); const fromDiscard=state.discard.length>0 && discardTop<target.score-1 && Math.random()<.72; const picked=fromDiscard?discardTop:state.deck.pop();
  flashAction(fromDiscard?'电脑拿起明牌':'电脑摸牌',fromDiscard?'请注意它替换的是哪个位置':'请观察电脑接下来的操作');
  motionBusy=true;
  if(!fromDiscard){ await flyCard(E.draw,targetCard(1,target.i),picked,{duration:520}); }
  if(thisAiSession!==sessionId)return;
  if(fromDiscard || picked<target.score-1 || (picked<=4&&Math.random()<.65)){
    const old=hand[target.i];
    if(fromDiscard) await flyCard(E.discard,targetCard(1,target.i),picked,{face:true,duration:550});
    await flyCard(targetCard(1,target.i),E.discard,old,{face:true,duration:480}); if(thisAiSession!==sessionId)return;
    if(fromDiscard)state.discard.pop();
    hand[target.i]=picked; state.faceUp[1][target.i]=fromDiscard; known[target.i]=picked; state.discard.push(old);
    logEvent(fromDiscard?`电脑用弃牌堆明牌替换了自己的 #${target.i+1}。`:`电脑替换了自己的 #${target.i+1}。`,[{owner:1,index:target.i}]);
    message(fromDiscard?'电脑使用弃牌堆明牌替换了一张牌。':'电脑摸牌并替换了一张牌。');
  } else {
    await flyCard(E.draw,E.discard,picked,{face:true,duration:500}); if(thisAiSession!==sessionId)return;
    state.discard.push(picked); logEvent('电脑弃掉了摸到的牌。',[]); message('电脑摸牌后选择弃牌。');
    if(skill(picked)&&Math.random()<.7){
      if(picked<=8){ const i=Math.floor(Math.random()*4); known[i]=hand[i]; logEvent(`电脑偷看了自己的 #${i+1}。`,[{owner:1,index:i}]); message('电脑使用了偷看。'); }
      else if(picked<=10){ const j=Math.floor(Math.random()*4); logEvent(`电脑侦查了你的 #${j+1}。`,[{owner:0,index:j}]); message('电脑使用了侦查。'); }
      else { const a=Math.floor(Math.random()*4), b=Math.floor(Math.random()*4); await Promise.all([flyCard(targetCard(1,a),targetCard(0,b),null,{turn:true,duration:700}),flyCard(targetCard(0,b),targetCard(1,a),null,{turn:true,duration:700})]); if(thisAiSession!==sessionId)return; [hand[a],state.hands[0][b]]=[state.hands[0][b],hand[a]]; [state.faceUp[1][a],state.faceUp[0][b]]=[state.faceUp[0][b],state.faceUp[1][a]]; delete known[a]; delete state.knowledge[0][b]; if(state.faceUp[1][a])known[a]=hand[a]; if(state.faceUp[0][b])state.knowledge[0][b]=state.hands[0][b]; logEvent(`电脑交换了 电脑 #${a+1} ↔ 你的 #${b+1}。`,[{owner:1,index:a},{owner:0,index:b}]); message('电脑使用交换，换走了你的一张暗牌！'); }
    }
  }
  if(state.caboBy===null&&hand.reduce((sum,_,i)=>sum+(Object.prototype.hasOwnProperty.call(known,i)?known[i]:6.5),0)<=10&&Math.random()<.45){ state.caboBy=1; state.finalLeft=2; logEvent('电脑宣告了 CABO。',[]); message('电脑宣告 CABO！你还有最后一个回合。'); flashAction('电脑宣告 CABO','这是你的最后一个回合'); }
  motionBusy=false; render(); const thisSession=sessionId; aiEndTimer=setTimeout(()=>{if(thisSession===sessionId)nextTurn();},1300);
}

function callCabo(){ if(motionBusy||state.phase!=='turn'||state.turn!==0)return; state.caboBy=0; state.finalLeft=2; logEvent('你宣告了 CABO。',[]); message('你宣告了 CABO！电脑再行动一回合。'); flashAction('你宣告了 CABO','电脑还有最后一个回合'); nextTurn(); }

function finish(){
  if(state.phase==='done')return;
  state.phase='done'; const result=UOBQRules.scoreRound(state.hands,state.caboBy);
  const outcome=result.winner===null?'本局平局！':result.winner===0?'你赢了！':'电脑赢了！';
  const caller=state.caboBy===0?'你':'电脑'; const verdict=result.success?caller+'宣告 CABO 成功，结算为 0 分。':caller+'宣告 CABO 失败，原始点数额外加 10 分。';
  addRound(result);
  logEvent('本局结束：'+outcome,[]); message(outcome+' '+verdict); render();
  const scoreCell=(name,i)=>`<div>${name}<small>原始 ${result.sums[i]} 点</small><strong>${result.scores[i]}</strong><small>结算分</small></div>`;
  const body=`<strong>${verdict}</strong><div class="results">${scoreCell('你的分数',0)}${scoreCell('电脑分数',1)}</div><small>分数越低越好；若宣告者与对手点数相同，也视为宣告失败。</small>`;
  const matchEnd=matchData.active.finished;
  const extra=`<div class="recap-inline">本场累计：你 ${matchData.active.totals[0]} 分 · 电脑 ${matchData.active.totals[1]} 分；距离100：你 ${Math.max(0,100-matchData.active.totals[0])} 分 · 电脑 ${Math.max(0,100-matchData.active.totals[1])} 分。${matchEnd?'本场已结束。':''}</div>`;
  showDialog(outcome,body+extra,matchEnd?[[ '查看整场战绩',()=>{hideDialog();openRecap();}],['新建比赛',()=>{ensureNewMatch();setup();}]]:[[ '下一小局',nextRound ],['战绩复盘',()=>{hideDialog();openRecap();}],['返回首页',()=>location.href='index.html']]);
}

function showDialog(title,body,actions){ $('overlayTitle').textContent=title; $('overlayBody').innerHTML='<p>'+body+'</p>'; $('overlayButtons').replaceChildren(...actions.map(([label,fn],i)=>{const b=document.createElement('button'); b.textContent=label; if(i>0)b.className='secondary'; b.addEventListener('click',fn); return b;})); E.overlay.hidden=false; }
function hideDialog(){ E.overlay.hidden=true; }

E.draw.addEventListener('click',draw);
E.discard.addEventListener('click',takeDiscard);
E.discard.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault(); takeDiscard();} });
E.discardDrawn.addEventListener('click',()=>{
  if(motionBusy||state.phase!=='decision')return;
  const n=state.drawn;
  transaction(async id=>{ flashAction('正在弃牌','卡牌移向弃牌堆'); await flyCard(E.drawn.firstElementChild,E.discard,n,{face:true,duration:520}); if(id!==sessionId)return; state.discard.push(n); logEvent(`你弃掉了 ${n} 点牌。`,[]); message('已弃掉 '+n+' 点牌。'); nextTurn(); });
});
E.useAbility.addEventListener('click',useAbility);
E.callCabo.addEventListener('click',callCabo);
$('restart').addEventListener('click',()=>showDialog('新建比赛？','这将清零当前累计分；已完成的小局会保存到历史。如果当前小局未完成，它不会计分。',[['确定新建',()=>{ensureNewMatch();setup();}],['继续比赛',hideDialog]]));
$('openRecap').addEventListener('click',openRecap);
$('closeRecap').addEventListener('click',closeRecap);
setup();
