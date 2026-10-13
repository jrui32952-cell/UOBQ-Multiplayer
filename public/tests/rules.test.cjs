const assert=require('node:assert/strict');
const rules=require('../game-rules.js');
const hands=(a,b)=>[[a,0,0,0],[b,0,0,0]];
const scenarios=[
 ['玩家宣告成功',hands(3,9),0,[0,9],true],
 ['玩家宣告失败',hands(10,8),0,[20,8],false],
 ['双方平点宣告失败',hands(7,7),0,[17,7],false],
 ['电脑宣告成功',hands(6,2),1,[6,0],true],
 ['电脑宣告失败',hands(3,9),1,[3,19],false],
 ['零点宣告成功',hands(0,9),0,[0,9],true],
];
for(const [name,h,caller,expected,success] of scenarios){const x=rules.scoreRound(h,caller);assert.deepEqual(x.scores,expected,name);assert.equal(x.success,success,name);console.log('PASS',name)}
assert.throws(()=>rules.scoreRound([[1,2],[0,0,0,0]],0));
console.log('PASS invalid hand rejected');
