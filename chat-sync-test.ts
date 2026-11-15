import {strict as assert} from 'node:assert';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createChatSync} from './chat-sync';
const root=await mkdtemp(join(tmpdir(),'qq-sync-'));try{
 const payloads:any[]=[];let fail=false;const send=async(p:string)=>{if(fail)throw Error('Unavailable');payloads.push(JSON.parse(p));};
 let sync=createChatSync(root,send);await sync.initialize();
 const old='2000-01-01T00:00:00Z',future='2099-01-01T00:00:00Z';
 const messages:any[]=[{id:'old',direction:'in',text:'history',createdAt:old,externalId:'oldkey'},{id:'old-reply',direction:'out',text:'history reply',createdAt:future,inReplyTo:'oldkey'}];
 const read=async()=>messages;const sessions=[{id:'session'}];await sync.sync('owner',sessions,read);assert.equal(payloads.length,0);
 messages.push({id:'new',direction:'in',text:'hello',createdAt:future,externalId:'newkey'});
 fail=true;await assert.rejects(sync.sync('owner',sessions,read));fail=false;await sync.sync('owner',sessions,read);assert.equal(payloads.length,1);assert.equal(payloads[0].messages.length,1);
 sync=createChatSync(root,send);await sync.sync('owner',sessions,read);assert.equal(payloads.length,1);
 messages.push({id:'reply',direction:'out',text:'done',createdAt:future,inReplyTo:'newkey'});await sync.sync('owner',sessions,read);assert.equal(payloads.length,2);assert.equal(payloads[1].messages.length,2);
 console.log('QQ sync cutoff, retries, durable dedup and turn binding passed');
}finally{await rm(root,{recursive:true,force:true});}
