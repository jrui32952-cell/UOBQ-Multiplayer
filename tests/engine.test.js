'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');const {createMatch,startRound,act,view,score}=require('../server/engine');
function match(){const m=createMatch();m.players=[{name:'A',connected:true},{name:'B',connected:true}];startRound(m);return m;}
function memory(m){act(m,0,{type:'memory',index:0});act(m,0,{type:'memory',index:2});act(m,1,{type:'memory',index:1});act(m,1,{type:'memory',index:3});}
test('lobby, dealing, unique positions and hidden info',()=>{const m=match();assert.equal(m.deck.length,47);assert.equal(view(m,0).hands[1][0].value,null);assert.equal(view(m,1).hands[0][0].value,null);assert.equal(m.phase,'memory');memory(m);assert.equal(m.phase,'turn');assert.equal(view(m,0).hands[0][0].value,m.hands[0][0]);assert.equal(view(m,1).hands[0][0].value,null);});
test('cannot act out of turn or view more than two initially',()=>{const m=match();assert.throws(()=>act(m,0,{type:'draw'}));memory(m);assert.throws(()=>act(m,1,{type:'draw'}));assert.throws(()=>act(m,0,{type:'memory',index:3}));});
test('discard public card stays faceup and does not activate skill',()=>{const m=match();memory(m);m.discard.push(11);act(m,0,{type:'take'});assert.throws(()=>act(m,0,{type:'ability'}));act(m,0,{type:'replace',index:2});assert.equal(m.face[0][2],true);assert.equal(view(m,1).hands[0][2].value,11);assert.equal(m.turn,1);});
test('deck replacement stays private to opponent and slot fixed',()=>{const m=match();memory(m);act(m,0,{type:'draw'});act(m,0,{type:'replace',index:3});assert.equal(view(m,1).hands[0][3].value,null);assert.match(m.events[0].text,/#4/);});
test('skill targets expose slot but not card value to opponent',()=>{const m=match();memory(m);m.phase='decision';m.turn=0;m.drawn=9;m.source='deck';act(m,0,{type:'ability'});act(m,0,{type:'target',index:1});assert.equal(view(m,0).hands[1][1].value,m.hands[1][1]);assert.equal(view(m,1).hands[0][1].value,null);});
test('swap transfers face up flag and public info',()=>{const m=match();memory(m);m.face[0][0]=true;m.phase='decision';m.drawn=11;m.source='deck';act(m,0,{type:'ability'});act(m,0,{type:'select',index:0});act(m,0,{type:'target',index:2});assert.equal(m.face[1][2],true);assert.equal(view(m,0).hands[1][2].value,m.hands[1][2]);});
test('cabo +10 failures and strict ties',()=>{let r=score([[1,1,1,1],[2,2,2,2]],0);assert.equal(r.points[0],0);r=score([[3,3,3,3],[1,1,1,1]],0);assert.equal(r.points[0],22);r=score([[1,2,3,4],[1,2,3,4]],0);assert.equal(r.points[0],20);});
test('final turn, history and 100 point match',()=>{const m=match();memory(m);m.scores=[99,99];act(m,0,{type:'cabo'});assert.equal(m.turn,1);act(m,1,{type:'draw'});act(m,1,{type:'discard'});assert.equal(m.phase,'match-end');assert.equal(m.history.length,1);assert.throws(()=>act(m,1,{type:'start'}));act(m,0,{type:'reset'});assert.equal(m.phase,'memory');assert.deepEqual(m.scores,[0,0]);});
test('swap only invalidates memory of exchanged positions',()=>{
  const m=match();memory(m);
  const p0Unchanged=m.views[0][2],p1Unchanged=m.views[1][3];
  m.phase='decision';m.turn=0;m.drawn=11;m.source='deck';
  act(m,0,{type:'ability'});act(m,0,{type:'select',index:0});act(m,0,{type:'target',index:1});
  assert.equal(m.views[0][2],p0Unchanged,'player A retains memory of own untouched #3');
  assert.equal(m.views[1][3],p1Unchanged,'player B retains memory of own untouched #4');
  assert.equal(view(m,0).hands[0][0].value,null,'swapped concealed slot must become unknown');
  assert.equal(view(m,1).hands[1][1].value,null,'opponent swapped concealed slot must become unknown');
});
