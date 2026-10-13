/* UOBQ provisional scoring rule B. Strictly lowest caller gets zero,
   otherwise caller takes their hand sum plus ten penalty points. */
(function(root,factory){const rules=factory();if(typeof module==='object'&&module.exports)module.exports=rules;root.UOBQRules=rules;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const FAILURE_PENALTY=10;
  function scoreRound(hands,caboBy){
    if(!Array.isArray(hands)||hands.length!==2||!hands.every(h=>Array.isArray(h)&&h.length===4))throw new Error('需要双方各四张牌');
    if(caboBy!==0&&caboBy!==1)throw new Error('缺少宣告玩家');
    const sums=hands.map(h=>h.reduce((s,n)=>s+n,0));
    const success=sums[caboBy]<sums[1-caboBy];
    const scores=[...sums];scores[caboBy]=success?0:sums[caboBy]+FAILURE_PENALTY;
    const winner=scores[0]===scores[1]?null:(scores[0]<scores[1]?0:1);
    return {sums,scores,caboBy,success,penalty:success?0:FAILURE_PENALTY,winner};
  }
  return {FAILURE_PENALTY,scoreRound};
});
