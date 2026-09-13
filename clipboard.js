/* Keep the first copy attempt inside the click gesture for mobile browsers. */
(function(root){
async function copy(text,field){
 const value=String(text);let ok=false;
 if(field){field.value=value;field.focus();field.select();field.setSelectionRange?.(0,value.length);try{ok=document.execCommand('copy');}catch{}}
 if(ok)return true;
 try{if(root.navigator?.clipboard?.writeText){await root.navigator.clipboard.writeText(value);return true;}}catch{}
 if(field){field.focus();field.select();field.setSelectionRange?.(0,value.length);}
 return false;
}
root.CopyText={copy};
})(globalThis);
