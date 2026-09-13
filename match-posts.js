/* Per-match Discord post formatting and independent timers. No messages are sent. */
(function(root){
'use strict';
const B=typeof module!=='undefined'?require('./bracket.js'):root.Bracket;
const commands=['!投票','!複数投票','!コメント投票','!連打投票'];
const emojis=['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
function time(value,unit){const n=Number(value);if(!Number.isInteger(n)||n<1||n>999999||!['s','m'].includes(unit))throw Error('時間は1〜999999の整数と、秒(s)または分(m)で指定してください。');return {value:n,unit};}
function validTime(t){return !!t&&Number.isInteger(t.value)&&t.value>=1&&t.value<=999999&&['s','m'].includes(t.unit);}
function config(b){const p=b.posts||{},overrides={};for(const [id,o] of Object.entries(p.overrides||{})){if(!/^R\d+-M\d+$/.test(id)||!o)continue;const v={};if(validTime(o.matchTime))v.matchTime={...o.matchTime};if(validTime(o.voteTime))v.voteTime={...o.voteTime};if(commands.includes(o.command))v.command=o.command;overrides[id]=v;}
 return {matchTime:validTime(p.matchTime)?{...p.matchTime}:{value:60,unit:'s'},voteTime:validTime(p.voteTime)?{...p.voteTime}:{value:60,unit:'s'},command:commands.includes(p.command)?p.command:'!投票',overrides};}
function options(b,id){const p=config(b),o=p.overrides[id]||{};return {matchTime:o.matchTime||p.matchTime,voteTime:o.voteTime||p.voteTime,command:o.command||p.command};}
function update(b,ids,kind,value,unit,command){if(!['match','vote'].includes(kind))throw Error('投稿種別が不正です。');const timer=time(value,unit);if(kind==='vote'&&!commands.includes(command))throw Error('投票方式を選択してください。');const g=B.graph(b.entries,b.k);if(ids!==null&&(!Array.isArray(ids)||ids.some(id=>!g.byId.has(id))))throw Error('対戦が見つかりません。');const p=config(b),key=kind==='match'?'matchTime':'voteTime';
 if(ids===null){p[key]=timer;if(kind==='vote')p.command=command;for(const o of Object.values(p.overrides)){delete o[key];if(kind==='vote')delete o.command;}}
 else for(const id of ids){const o=p.overrides[id]||{};o[key]={...timer};if(kind==='vote')o.command=command;p.overrides[id]=o;}
 b.posts=p;
}
function heading(g,m){if(m.round===g.rounds.length-1)return '決勝';const prefix=m.round===g.rounds.length-2?'準決勝':`${m.round+1}回戦`;return `${prefix}第${g.rounds[m.round].findIndex(x=>x.id===m.id)+1}試合`;}
function nameText(s){return String(s).replace(/[\r\n]+/g,' ').replace(/@/g,'@\u200b').replace(/([\\*_~`|>#[\]])/g,'\\$1');}
function format(b,id){const g=B.graph(b.entries,b.k),m=g.byId.get(id);if(!m)throw Error('対戦が見つかりません。');const st=B.status(b,g).states.get(id),o=options(b,id),label=heading(g,m);if(!st.ready)return {ready:false,label,match:'',vote:'',count:m.sources.length,options:o};
 const entries=new Map(b.entries.map(e=>[e.id,e])),lines=st.slots.map((entry,i)=>`${emojis[i]} ${nameText(entries.get(entry).name)}`).join('\n\n');
 const match=`!タイマー ${o.matchTime.value}${o.matchTime.unit}\n\n## ${label}\n\n${lines}`;
 const vote=`${o.command} ${st.slots.length} ${o.voteTime.value}${o.voteTime.unit}\n\n## ${label} 投票\n\n${lines}`;
 return {ready:true,label,match,vote,count:st.slots.length,options:o};}
const api={commands,emojis,time,config,options,update,heading,format};if(typeof module!=='undefined')module.exports=api;else root.MatchPosts=api;
})(globalThis);
