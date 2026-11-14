import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
// Durable cutoff is written before reading any messages. Old turns never enter the mirror.
export function createChatSync(dataDir: string, send: (payload: string) => Promise<unknown>) {
 const path=join(dataDir,'chat-sync.json');
 let state: {since:string; sent:Record<string,string>} | undefined;
 async function save(){await mkdir(dataDir,{recursive:true});await writeFile(path+'.next',JSON.stringify(state),{mode:0o600});await rename(path+'.next',path);}
 async function initialize(){if(state)return;try{state=JSON.parse(await readFile(path,'utf8'));if(!state?.since||!state.sent)throw Error('Invalid sync journal');}catch(e:any){if(e.code!=='ENOENT')throw e;state={since:new Date().toISOString(),sent:{}};await save();}}
 return {initialize,async sync(owner:string,sessions:any[],messages:(id:string)=>Promise<any[]>){
  await initialize();const ownerKey=createHash('sha256').update(owner).digest('hex');
  for(const session of sessions){
   const all=await messages(session.id), inputs=all.filter(m=>m.direction==='in'&&m.createdAt>=state!.since);
   const keys=new Set(inputs.flatMap(m=>[m.externalId,m.requestKey]).filter(Boolean));
   const selected=all.filter(m=>inputs.includes(m)||(m.direction==='out'&&keys.has(m.inReplyTo)));
   if(!selected.length)continue;
   const payload={session:ownerKey+':'+session.id,messages:selected.map(m=>({id:m.id,role:m.direction==='in'?'user':'assistant',text:String(m.text).slice(0,200000)+(m.attachments?.length?'\n\n[附件请在 QQ 查看]':''),at:m.createdAt,progress:m.progress??''}))};
   const value=JSON.stringify(payload), digest=createHash('sha256').update(value).digest('hex');
   if(state!.sent[payload.session]===digest)continue;
   await send(value);state!.sent[payload.session]=digest;await save();
  }
 }};
}
