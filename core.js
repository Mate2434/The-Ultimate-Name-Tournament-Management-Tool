/* Browser + Node shared logic; no dependencies. */
(function(root){
'use strict';
function parseCSV(text){
 text=text.replace(/^\uFEFF/,''); if(/^\s*</.test(text))throw Error('CSVではなくHTMLが返されました。CSVファイルを使用してください。');
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else quoted=false;}else cell+=c;}else if(c==='"'&&cell==='')quoted=true;else if(c===','){row.push(cell);cell='';}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw Error('CSVの引用符が閉じていません。');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 if(!rows.length||rows[0].length<2)throw Error('見出し行を含むCSVを読み込んでください。');
 const headers=rows.shift().map((x,i)=>x.trim()||`列${i+1}`);
 if(rows.some(r=>r.length!==headers.length))throw Error('列数が一致しない行があります。CSVを確認してください。');return {headers,rows};
}
function normalizeID(x){return String(x||'').trim().replace(/^<@!?(\d+)>$/,'$1').replace(/^@/,'').toLowerCase();}
function assess(t){const counts=new Map();return t.rows.map((cells,i)=>{const id=normalizeID(cells[t.idCol]);const hasName=String(cells[t.nameCol]||'').trim();let status='採用',n=0;if(!id)status='ID未入力';else if(!hasName)status='名前未入力';else{n=(counts.get(id)||0)+1;counts.set(id,n);if(t.limit>0&&n>t.limit)status='上限超過';}return {cells,id,n,status,row:i+2};});}
function safe(x,code=false){let s=String(x??'').replace(/@/g,'@\u200b').replace(/```/g,'``\u200b`');return code?s:s.replace(/([\\*_~`|>#[\]])/g,'\\$1');}
function output(t){const code=t.format.code;const groups=new Map();for(const r of assess(t).filter(r=>r.status==='採用')){const category=!Array.isArray(t.extraCols)&&t.format.category&&t.categoryCol>=0?(r.cells[t.categoryCol]||'未分類'):'';if(!groups.has(category))groups.set(category,[]);groups.get(category).push(r);}
 const messages=[];let current='';const flush=()=>{if(current)messages.push(current);current='';};const push=s=>{if(current.length+s.length+2>1900)flush();current+=(current?'\n\n':'')+s;};
 for(const [cat,rows] of groups){const heading=[t.format.heading?t.format.heading.replaceAll('{大会名}',t.name):'',cat?`【${cat}】`:''].filter(Boolean).map(x=>safe(x)).join('\n');
 const blocks=rows.map((r,i)=>{const title=safe(r.cells[t.nameCol],code);const lines=[`${t.format.number?`${i+1}. `:''}${title}`];const extras=Array.isArray(t.extraCols)?t.extraCols.filter(c=>c>=0):[];const columns=[...new Set([...(t.format.category?extras:[]),...t.fields.filter(c=>!extras.includes(c))])];for(const c of columns){if(c===t.nameCol||!r.cells[c])continue;lines.push(`${t.format.labels?safe(t.headers[c],code)+'：':''}${safe(r.cells[c],code)}`);}return lines.join('\n');});
 let body='';const wrap=b=>(heading?heading+'\n':'')+(code?'```\n'+b+'\n```':b);const emit=()=>{if(body)push(wrap(body));body='';};
 for(const b of blocks){if(wrap(b).length>1900){emit();const room=1900-wrap('').length;if(room<50)throw Error('見出しが長すぎます。');let chars=Array.from(b);while(chars.length){let piece='';while(chars.length&&piece.length+chars[0].length<=room)piece+=chars.shift();push(wrap(piece));}continue;}if(wrap(body+(body?'\n\n':'')+b).length>1900)emit();body+=(body?'\n\n':'')+b;}emit();}
 flush();return messages;
}
function sheetURL(value,gid){const u=new URL(value);if(u.hostname!=='docs.google.com')throw Error('GoogleスプレッドシートのURLを指定してください。');const m=u.pathname.match(/^\/spreadsheets\/d\/(e\/)?([\w-]+)/);if(!m)throw Error('URLを確認してください。');const tab=gid||u.searchParams.get('gid')||new URLSearchParams(u.hash.slice(1)).get('gid')||'0';if(!/^\d+$/.test(tab))throw Error('gidは数字で指定してください。');return m[1]?`https://docs.google.com/spreadsheets/d/e/${m[2]}/pub?output=csv&gid=${tab}`:`https://docs.google.com/spreadsheets/d/${m[2]}/gviz/tq?tqx=out:csv&gid=${tab}`;}
const api={parseCSV,normalizeID,assess,output,sheetURL};if(typeof module!=='undefined')module.exports=api;else root.Core=api;
})(globalThis);
