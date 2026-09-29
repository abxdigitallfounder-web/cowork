import { NextRequest, NextResponse } from 'next/server';
import { database, type Database } from '@/db';
import { auth } from '@/lib/auth/server';
export const dynamic = 'force-dynamic';

type Person = { id:string; email:string; name:string; role:string };
type CreativeOwners = { status:string; copy_assignee:string; editor_assignee:string; media_assignee:string };
const copyFields = ['product','title','parent','kind','hypothesis','offer','angle','message','hook','hookCopy','hookVisual','concept','script','editorNotes','variable','keep','change','copyAssignee','editorAssignee','mediaAssignee','dueAt'];
const editorFields = ['version','assetUrl','editorResponse','editorChecklist'];
const mediaFields = ['spend','cpa','roas','ctr','cvr','result','learning','nextAction'];
const fields = [...copyFields,...editorFields,...mediaFields,'reviewFeedback'];
const columns:Record<string,string> = Object.fromEntries(fields.map(k=>[k,k.replace(/[A-Z]/g,c=>'_'+c.toLowerCase())]));
const roles=['copy','editor','media','admin'];
// A Vercel corta requisições acima de ~4,5 MB e o base64 cresce um terço: 3 MB de PDF cabe.
const MAX_PDF_BYTES=3*1024*1024;
const MAX_PDF_PER_CREATIVE=3;
const toError=(error:string,status=400)=>NextResponse.json({error},{status});
async function identity(){
 const {data:session}=await auth.getSession();
 const user=session?.user;
 if(!user?.email)return null;
 const email=user.email.toLowerCase();
 return{id:user.id,email,name:user.name||email.split('@')[0]};
}
async function person(db:Database):Promise<Person|null>{
 const u=await identity();if(!u)return null;
 const count=await db.first<{n:number}>('SELECT COUNT(*) AS n FROM team_members');
 if(!count?.n)await db.run('INSERT INTO team_members (email,name,role,created_at) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO NOTHING',[u.email,u.name,'admin',Date.now()]);
 const member=await db.first<{role:string}>('SELECT role FROM team_members WHERE email=$1',[u.email]);
 if(!member)return {...u,role:'pending'};
 return {...u,role:member.role};
}
async function log(db:Database,id:string,actor:string,message:string){await db.run('INSERT INTO activity (id,creative_id,actor,text,created_at) VALUES ($1,$2,$3,$4,$5)',[crypto.randomUUID(),id,actor,message,Date.now()])}
function canWork(u:Person,row:any,role:string){return u.role==='admin'||(u.role===role&&row[role==='media'?'media_assignee':role+'_assignee']===u.email)}
export async function GET(){
 try{const db=database();const u=await person(db);if(!u)return toError('Entre com sua conta para acessar o workspace.',401);if(u.role==='pending')return toError('Sua conta ainda não foi adicionada à equipe. Peça acesso ao administrador.',403);
 const [c,m,a,t]=await Promise.all([
 db.all('SELECT * FROM creatives ORDER BY updated_at DESC LIMIT 500'),
 db.all('SELECT * FROM comments ORDER BY created_at DESC LIMIT 1200'),
 db.all('SELECT * FROM activity ORDER BY created_at DESC LIMIT 400'),
 db.all('SELECT email,name,role FROM team_members ORDER BY name,email')]);
 const files=await db.all('SELECT id,creative_id,name,size,uploaded_by,created_at FROM brief_files ORDER BY created_at DESC LIMIT 500');
 return NextResponse.json({user:u,creatives:c,comments:m,activity:a,team:t,briefFiles:files},{headers:{'Cache-Control':'no-store'}})
 }catch(e){console.error(e);return toError('Workspace indisponível no momento. Tente novamente.',503)}
}
export async function POST(req:NextRequest){
 let body:any;try{body=await req.json()}catch{return toError('Dados inválidos.')}
 try{const db=database();const u=await person(db);if(!u)return toError('Entre com sua conta para continuar.',401);if(u.role==='pending')return toError('Conta ainda sem acesso à equipe.',403);
 const now=Date.now();
 if(body.action==='member'){
  if(u.role!=='admin')return toError('Apenas o administrador gerencia funções.',403);
  const email=String(body.email||'').trim().toLowerCase(),role=String(body.role||'');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!roles.includes(role))return toError('E-mail ou função inválida.');
  if(email===u.email&&role!=='admin')return toError('Você não pode remover seu próprio acesso administrativo.');
  await db.run('INSERT INTO team_members (email,name,role,created_at) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO UPDATE SET role=excluded.role',[email,String(body.name||email.split('@')[0]).slice(0,80),role,now]);
  return NextResponse.json({ok:true});
 }
 if(body.action==='create'){
  if(!['admin','copy'].includes(u.role))return toError('Somente Copy pode criar briefs.',403);
  const number=await db.first<{n:number}>("INSERT INTO sequence (key,value) VALUES ('creative',184) ON CONFLICT (key) DO UPDATE SET value=sequence.value+1 RETURNING value AS n");
  const n=number?.n||184,id='CR'+n;
  await db.run('INSERT INTO creatives (id,number,product,title,kind,status,owner,owner_email,copy_assignee,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',[id,n,String(body.product||'BLIVE').slice(0,40),String(body.title||'Novo criativo').slice(0,120),String(body.kind||'Novo conceito').slice(0,40),'brief',u.name,u.email,u.email,now,now]);
  await log(db,id,u.name,'criou o brief');return NextResponse.json({id,updatedAt:now});
 }
 if(body.action==='comment'){
  const id=String(body.creativeId||''),message=String(body.body||'').trim();
  if(!/^CR\d+$/.test(id)||!message||message.length>2000)return toError('Escreva uma mensagem de até 2.000 caracteres.');
  const exists=await db.first('SELECT id FROM creatives WHERE id=$1',[id]);if(!exists)return toError('Criativo não encontrado.',404);
  await db.run('INSERT INTO comments (id,creative_id,author,email,body,created_at) VALUES ($1,$2,$3,$4,$5,$6)',[crypto.randomUUID(),id,u.name,u.email,message,now]);return NextResponse.json({ok:true});
 }
 if(body.action==='update'){
  const id=String(body.id||'');if(!/^CR\d+$/.test(id))return toError('Criativo inválido.');
  const row=await db.first<any>('SELECT * FROM creatives WHERE id=$1',[id]);if(!row)return toError('Criativo não encontrado.',404);
  const data=body.data||{},keys=Object.keys(data);
  if(!keys.length||keys.some(k=>!fields.includes(k)))return toError('Campo inválido.');
  if(keys.some(k=>typeof data[k]!=='string'&&typeof data[k]!=='number'&&data[k]!==null)||keys.some(k=>typeof data[k]==='string'&&data[k].length>12000))return toError('Conteúdo inválido ou muito longo.');
  for(const key of keys){
   const allowed=u.role==='admin'||(copyFields.includes(key)&&row.status==='brief'&&canWork(u,row,'copy'))||(key==='mediaAssignee'&&row.status==='revisao'&&canWork(u,row,'copy'))||(editorFields.includes(key)&&row.status==='producao'&&canWork(u,row,'editor'))||(mediaFields.includes(key)&&row.status==='teste'&&canWork(u,row,'media'));
   if(!allowed)return toError('Este campo pertence a outra etapa ou responsável.',403);
  }
  if(keys.includes('assetUrl')&&data.assetUrl&&(!/^https?:\/\//i.test(data.assetUrl)||data.assetUrl.length>2000))return toError('Use um link HTTP ou HTTPS válido para a peça.');
  if(keys.includes('editorChecklist')){try{const checks=JSON.parse(data.editorChecklist);if(!Array.isArray(checks)||checks.length!==3||checks.some((v:unknown)=>typeof v!=='boolean'))return toError('Checklist inválido.')}catch{return toError('Checklist inválido.')}}
  if(keys.includes('dueAt')&&data.dueAt&&!/^\d{4}-\d{2}-\d{2}$/.test(data.dueAt))return toError('Prazo inválido.');
  for(const key of keys.filter(k=>['spend','cpa','roas','ctr','cvr'].includes(k))){const v=data[key];if(v!==null&&(!Number.isFinite(v)||v<0||(key==='ctr'||key==='cvr')&&v>100))return toError('Métrica inválida.')} 
  if(keys.some(k=>['copyAssignee','editorAssignee','mediaAssignee'].includes(k))){
   for(const key of keys.filter(k=>['copyAssignee','editorAssignee','mediaAssignee'].includes(k))){if(data[key]){const expected=key==='mediaAssignee'?'media':key.replace('Assignee','');const m=await db.first<{role:string}>('SELECT role FROM team_members WHERE email=$1',[String(data[key]).toLowerCase()]);if(!m||!([expected,'admin'].includes(m.role)))return toError(`Responsável de ${expected} precisa estar cadastrado na função correspondente.`)}}
  }
  const expected=Number(body.expectedUpdatedAt);
  if(!expected||row.updated_at!==expected)return toError('Este CR mudou enquanto você editava. Copie seu texto e atualize antes de salvar.',409);
  const version=Math.max(now,row.updated_at+1);const vals=keys.map(k=>data[k]);const result=await db.run(`UPDATE creatives SET ${keys.map((k,i)=>`${columns[k]}=$${i+1}`).join(',')},updated_at=$${keys.length+1} WHERE id=$${keys.length+2} AND updated_at=$${keys.length+3}`,[...vals,version,id,expected]);
  if(!result.changes)return toError('Este CR mudou enquanto você editava. Atualize e tente novamente.',409);
  await log(db,id,u.name,keys.some(k=>mediaFields.includes(k))?'registrou o resultado':keys.some(k=>editorFields.includes(k))?'atualizou a produção':'atualizou o brief');return NextResponse.json({ok:true,updatedAt:version});
 }
 if(body.action==='transition'){
  const id=String(body.id||'');const row=await db.first<any>('SELECT * FROM creatives WHERE id=$1',[id]);if(!row)return toError('Criativo não encontrado.',404);
  if(Number(body.expectedUpdatedAt)!==row.updated_at)return toError('O CR foi atualizado. Recarregue antes de avançar.',409);
  const next=String(body.to||'');const pair=row.status+'>'+next;
  const rules:Record<string,string[]>={'brief>producao':['copy'],'producao>revisao':['editor'],'revisao>producao':['copy'],'revisao>teste':['copy','media'],'teste>winner':['media'],'teste>arquivado':['media']};
  const owners=rules[pair];if(!owners)return toError('Passagem de etapa inválida.');
  if(!owners.some(r=>canWork(u,row,r)))return toError('Esta passagem pertence ao responsável da etapa.',403);
  if(pair==='brief>producao'&&(!row.hypothesis||!row.angle||!row.hook||!row.script||!row.editor_notes||!row.editor_assignee))return toError('Complete hipótese, ângulo, hook, roteiro, direção e responsável da edição.');
  if(pair==='producao>revisao'&&(!row.asset_url||!row.editor_checklist||!JSON.parse(row.editor_checklist||'[]').every(Boolean)||JSON.parse(row.editor_checklist||'[]').length!==3))return toError('Anexe o link do asset e conclua os três itens do checklist.');
  if(pair==='revisao>teste'&&(!row.asset_url||!row.media_assignee))return toError('Defina o responsável de mídia e o link do asset.');
  if(pair==='revisao>producao'&&!String(body.feedback||'').trim())return toError('Descreva o ajuste solicitado.');
  if((pair==='teste>winner'||pair==='teste>arquivado')&&(!row.learning||!row.next_action||row.spend===null||row.cpa===null))return toError('Registre investimento, CPA, aprendizado e próximo passo antes da decisão.');
  const feedback=pair==='revisao>producao'?String(body.feedback).trim().slice(0,3000):pair==='producao>revisao'?'':row.review_feedback;const version=Math.max(now,row.updated_at+1);
  const result=await db.run('UPDATE creatives SET status=$1,review_feedback=$2,updated_at=$3 WHERE id=$4 AND updated_at=$5',[next,feedback,version,id,row.updated_at]);if(!result.changes)return toError('O CR mudou. Atualize e tente novamente.',409);
  await log(db,id,u.name,`${row.status} → ${next}${pair==='revisao>producao'?': '+feedback:''}`);return NextResponse.json({ok:true});
 }
 if(body.action==='delete'){
  const id=String(body.id||'');if(!/^CR\d+$/.test(id))return toError('Criativo inválido.');
  const row=await db.first<{owner_email:string,status:string}>('SELECT owner_email,status FROM creatives WHERE id=$1',[id]);if(!row)return toError('Criativo não encontrado.',404);
  // O autor pode desistir da ideia enquanto ela ainda é só um brief. Depois que a
  // produção começa, o histórico é compartilhado e só o administrador apaga.
  const owns=row.owner_email===u.email&&row.status==='brief';
  if(u.role!=='admin'&&!owns)return toError('Só o administrador pode excluir um CR que já saiu do brief.',403);
  await db.run('DELETE FROM brief_files WHERE creative_id=$1',[id]);
  await db.run('DELETE FROM comments WHERE creative_id=$1',[id]);
  await db.run('DELETE FROM activity WHERE creative_id=$1',[id]);
  const result=await db.run('DELETE FROM creatives WHERE id=$1',[id]);
  if(!result.changes)return toError('Criativo não encontrado.',404);
  return NextResponse.json({ok:true});
 }
 if(body.action==='brief-file'){
  const id=String(body.creativeId||'');if(!/^CR\d+$/.test(id))return toError('Criativo inválido.');
  const row=await db.first<CreativeOwners>('SELECT status,copy_assignee,editor_assignee,media_assignee FROM creatives WHERE id=$1',[id]);if(!row)return toError('Criativo não encontrado.',404);
  if(u.role!=='admin'&&!(row.status==='brief'&&canWork(u,row,'copy')))return toError('O PDF do briefing é anexado pelo Copy enquanto o CR está em brief.',403);
  const name=String(body.name||'').trim().slice(0,160),data=String(body.data||'');
  if(!name.toLowerCase().endsWith('.pdf'))return toError('Envie um arquivo PDF.');
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(data))return toError('Arquivo inválido.');
  const size=Math.floor(data.length*3/4)-(data.endsWith('==')?2:data.endsWith('=')?1:0);
  if(!size)return toError('Arquivo vazio.');
  if(size>MAX_PDF_BYTES)return toError('O PDF precisa ter até 3 MB.');
  // Confere a assinatura do PDF (%PDF-) em vez de confiar na extensão ou no MIME.
  if(Buffer.from(data.slice(0,8),'base64').subarray(0,5).toString('latin1')!=='%PDF-')return toError('O arquivo não é um PDF válido.');
  const count=await db.first<{n:number}>('SELECT COUNT(*) AS n FROM brief_files WHERE creative_id=$1',[id]);
  if((count?.n||0)>=MAX_PDF_PER_CREATIVE)return toError(`Cada CR aceita até ${MAX_PDF_PER_CREATIVE} PDFs de briefing.`);
  const fileId=crypto.randomUUID();
  await db.run('INSERT INTO brief_files (id,creative_id,name,size,data,uploaded_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',[fileId,id,name,size,data,u.email,now]);
  await log(db,id,u.name,'anexou o PDF do briefing');
  return NextResponse.json({id:fileId,name,size,createdAt:now});
 }
 if(body.action==='brief-file-delete'){
  const fileId=String(body.fileId||'');
  const file=await db.first<{creative_id:string}>('SELECT creative_id FROM brief_files WHERE id=$1',[fileId]);
  if(!file)return toError('Arquivo não encontrado.',404);
  const row=await db.first<CreativeOwners>('SELECT status,copy_assignee,editor_assignee,media_assignee FROM creatives WHERE id=$1',[file.creative_id]);if(!row)return toError('Criativo não encontrado.',404);
  if(u.role!=='admin'&&!(row.status==='brief'&&canWork(u,row,'copy')))return toError('O PDF do briefing é removido pelo Copy enquanto o CR está em brief.',403);
  await db.run('DELETE FROM brief_files WHERE id=$1',[fileId]);
  await log(db,file.creative_id,u.name,'removeu o PDF do briefing');
  return NextResponse.json({ok:true});
 }
 return toError('Ação inválida.');
 }catch(e){console.error(e);return toError('Não foi possível concluir a operação. Seus dados permanecem na tela.',503)}
}
