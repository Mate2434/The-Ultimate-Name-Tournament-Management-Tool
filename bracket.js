/* Deterministic single-elimination graph. Each match advances exactly one entry. */
(function(root){
'use strict';
const MAX=256;
function checkSize(n,k){if(!Number.isInteger(n)||n<2||n>MAX)throw Error('参加回答は2〜256件にしてください。');if(!Number.isInteger(k)||k<2||k>10)throw Error('1戦の人数は2〜10人で指定してください。');}
function graph(entries,k){
 checkSize(entries.length,k);
 const rounds=[],matches=[],byId=new Map();
 const add=(round,sources)=>{if(!rounds[round])rounds[round]=[];const m={id:`R${round+1}-M${rounds[round].length+1}`,round,sources};rounds[round].push(m);matches.push(m);byId.set(m.id,m);return {type:'match',id:m.id};};
 const leaves=entries.map(e=>({type:'entry',id:e.id}));
 if(entries.length<=k){add(0,leaves);return {rounds,matches,byId,root:matches[0].id,byes:[]};}
 let target=1;while(target*k<entries.length)target*=k;
 const reduction=entries.length-target,groups=Math.ceil(reduction/(k-1));
 const positions=new Set(Array.from({length:groups},(_,i)=>Math.floor((i+.5)*target/groups)));
 const frontier=[],byes=[];let cursor=0,remaining=reduction;
 for(let i=0;i<target;i++){
  if(positions.has(i)){const size=Math.min(k,remaining+1);remaining-=size-1;frontier.push(add(0,leaves.slice(cursor,cursor+size)));cursor+=size;}
  else{frontier.push(leaves[cursor]);byes.push(leaves[cursor].id);cursor++;}
 }
 let current=frontier,round=1;
 while(current.length>1){const next=[];for(let i=0;i<current.length;i+=k)next.push(add(round,current.slice(i,i+k)));current=next;round++;}
 return {rounds,matches,byId,root:current[0].id,byes};
}
function summary(n,k){const g=graph(Array.from({length:n},(_,i)=>({id:`e${i}`})),k);return {k,rounds:g.rounds.length,matches:g.matches.length,byes:g.byes.length,minimumMatches:Math.ceil((n-1)/(k-1)),sizes:g.rounds.map(round=>{const counts={};round.forEach(m=>counts[m.sources.length]=(counts[m.sources.length]||0)+1);return Object.entries(counts).sort((a,b)=>Number(b[0])-Number(a[0])).map(([size,count])=>`${size}人戦×${count}`).join(' / ');})};}
function proposals(n){return Array.from({length:9},(_,i)=>summary(n,i+2));}
function shuffle(entries,random=Math.random){const result=entries.slice();for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));if(j<0||j>i)throw Error('乱数の範囲が不正です。');[result[i],result[j]]=[result[j],result[i]];}return result;}
function secureRandom(){if(root.crypto?.getRandomValues){const a=new Uint32Array(1);root.crypto.getRandomValues(a);return a[0]/4294967296;}return Math.random();}
function create(entries,k,source='answers',signature=''){
 checkSize(entries.length,k);if(new Set(entries.map(e=>e.id)).size!==entries.length)throw Error('回答IDが重複しています。');
 return {version:1,k,entries:entries.map(e=>({...e})),results:{},source,signature,created:new Date().toISOString()};
}
function status(b,g=graph(b.entries,b.k),ignoreResults=false){
 const winners=new Map(),states=new Map();for(const m of g.matches){const slots=m.sources.map(s=>s.type==='entry'?s.id:winners.get(s.id)||null);const ready=slots.every(Boolean);const chosen=ignoreResults?null:b.results[m.id];const winner=ready&&slots.includes(chosen)?chosen:null;if(winner)winners.set(m.id,winner);states.set(m.id,{slots,ready,winner});}
 return {states,champion:winners.get(g.root)||null,completed:winners.size};
}
function descendants(g,id){const result=[];let child=id;for(;;){const parent=g.matches.find(m=>m.sources.some(s=>s.type==='match'&&s.id===child));if(!parent)break;result.push(parent.id);child=parent.id;}return result;}
function choose(b,matchId,entryId){
 const g=graph(b.entries,b.k),m=g.byId.get(matchId);if(!m)throw Error('対戦が見つかりません。');
 const state=status(b,g).states.get(matchId);if(entryId!==null&&(!state.ready||!state.slots.includes(entryId)))throw Error('全員が揃った対戦から勝者を選んでください。');
 if((b.results[matchId]||null)===entryId)return [];
 const cleared=descendants(g,matchId);for(const id of cleared)delete b.results[id];if(entryId===null)delete b.results[matchId];else b.results[matchId]=entryId;return cleared;
}
function validate(b){
 try{
 if(!b||b.version!==1||!Array.isArray(b.entries)||!b.results||typeof b.results!=='object'||Array.isArray(b.results)||!['answers','demo','manual'].includes(b.source)||typeof b.signature!=='string'||typeof b.created!=='string')return false;
 checkSize(b.entries.length,b.k);
 if(!b.entries.every(e=>e&&typeof e.id==='string'&&e.id.length>0&&e.id.length<=100&&typeof e.name==='string'&&e.name.trim().length>0&&e.name.length<=10000&&typeof e.details==='string'&&e.details.length<=100000&&Number.isInteger(e.row)&&e.row>=0)||new Set(b.entries.map(e=>e.id)).size!==b.entries.length)return false;
 const g=graph(b.entries,b.k),st=status(b,g);
 return Object.entries(b.results).every(([id,winner])=>typeof winner==='string'&&g.byId.has(id)&&st.states.get(id).winner===winner);
 }catch{return false;}
}
function demo(n){checkSize(n,2);const prefix=['銀河','月影','天空','深海','白銀','紅蓮','雷鳴','幻夢','星屑','永遠','無限','暁'];const noun=['の剣士','のねこ','の王冠','の旅人','の天使','の魔術師','のプリン'];return Array.from({length:n},(_,i)=>({id:`demo-${i+1}`,name:`${prefix[i%prefix.length]}${noun[Math.floor(i/prefix.length)%noun.length]} ${String(i+1).padStart(3,'0')}`,details:`必殺技：架空奥義 第${i+1}式`,row:0}));}
const api={MAX,graph,summary,proposals,shuffle,secureRandom,create,status,descendants,choose,validate,demo};if(typeof module!=='undefined')module.exports=api;else root.Bracket=api;
})(globalThis);
