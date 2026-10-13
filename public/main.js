const modal = document.getElementById('rulesModal');
const openRules = document.getElementById('rulesOpen');
const closeRules = document.getElementById('rulesClose');
const doneRules = document.getElementById('rulesDone');
let previouslyFocused = null;
function showRules(){ previouslyFocused=document.activeElement; modal.hidden=false;document.body.style.overflow='hidden';closeRules.focus(); }
function hideRules(){ modal.hidden=true;document.body.style.overflow='';previouslyFocused?.focus(); }
openRules.addEventListener('click',showRules);
closeRules.addEventListener('click',hideRules);
doneRules.addEventListener('click',hideRules);
modal.addEventListener('click',e=>{if(e.target===modal)hideRules();});
document.addEventListener('keydown',e=>{if(modal.hidden)return;if(e.key==='Escape')hideRules();if(e.key==='Tab'){const focusables=[closeRules,doneRules];if(e.shiftKey&&document.activeElement===closeRules){e.preventDefault();doneRules.focus();}else if(!e.shiftKey&&document.activeElement===doneRules){e.preventDefault();closeRules.focus();}}});
// User-initiated synthesized ambient melody: no external audio files or autoplay.
const soundButton=document.getElementById('audioToggle'),soundText=document.getElementById('audioLabel'),soundSymbol=document.getElementById('audioSymbol');
let ctx=null, playing=false, loopId=null, noteIndex=0;
const melody=[261.63,329.63,392,329.63,293.66,349.23,440,349.23,261.63,329.63,392,523.25];
function playNote(freq){if(!ctx)return;const now=ctx.currentTime;const tone=ctx.createOscillator(),gain=ctx.createGain();tone.type='sine';tone.frequency.setValueAtTime(freq,now);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.024,now+.06);gain.gain.exponentialRampToValueAtTime(.0001,now+1.5);tone.connect(gain);gain.connect(ctx.destination);tone.start(now);tone.stop(now+1.6);}
async function toggleAudio(){if(!playing){try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();await ctx.resume();playing=true;playNote(melody[noteIndex++%melody.length]);loopId=setInterval(()=>playNote(melody[noteIndex++%melody.length]),950);}catch(e){soundText.textContent='音频不可用';return;}}else{playing=false;clearInterval(loopId);await ctx.suspend();}soundButton.setAttribute('aria-pressed',String(playing));soundButton.setAttribute('aria-label',playing?'关闭背景音乐':'打开背景音乐');soundText.textContent=playing?'音乐开启':'音乐关闭';soundSymbol.src=playing?'assets/icon-music-on.svg':'assets/icon-music-off.svg';soundSymbol.style.opacity=playing?'1':'.65';}
soundButton.addEventListener('click',toggleAudio);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing){playing=false;clearInterval(loopId);ctx?.suspend();soundButton.setAttribute('aria-pressed','false');soundButton.setAttribute('aria-label','打开背景音乐');soundText.textContent='音乐关闭';soundSymbol.style.opacity='.65';}});

const modeModal=document.getElementById('modeModal');
const playOpen=document.getElementById('playOpen');
const modeClose=document.getElementById('modeClose');
const multiplayerOpen=document.getElementById('multiplayerOpen');
const roomPreview=document.getElementById('roomPreview');
playOpen.addEventListener('click',()=>{modeModal.hidden=false;roomPreview.hidden=true;document.body.style.overflow='hidden';modeClose.focus();});
function closeMode(){modeModal.hidden=true;document.body.style.overflow='';playOpen.focus();}
modeClose.addEventListener('click',closeMode);
modeModal.addEventListener('click',e=>{if(e.target===modeModal)closeMode();});
multiplayerOpen.addEventListener('click',()=>{roomPreview.hidden=!roomPreview.hidden;});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modeModal.hidden)closeMode();});
