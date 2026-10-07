/** Despliega únicamente el control de acceso; nunca imprime credenciales. */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd(),true,{info(){},error(){}});
const required=['HOSTINGER_SMTP_HOST','HOSTINGER_SMTP_USER','HOSTINGER_SMTP_PASSWORD','AUTH_EMAIL_FROM','AUTH_EMAIL_SENDER_NAME'];
if(required.some(name=>!process.env[name]?.trim()) || process.env.HOSTINGER_SMTP_PORT!=='465') throw new Error('Completa las variables SMTP. La Edge Function requiere el puerto TLS 465.');
const temp=mkdtempSync(path.join(tmpdir(),'afcr-method-deploy-'));
const env={...process.env};
if(!env.SUPABASE_ACCESS_TOKEN?.trim()) delete env.SUPABASE_ACCESS_TOKEN;
const encoded=Buffer.from(JSON.stringify({host:env.HOSTINGER_SMTP_HOST,user:env.HOSTINGER_SMTP_USER,password:env.HOSTINGER_SMTP_PASSWORD,from:env.AUTH_EMAIL_FROM,name:env.AUTH_EMAIL_SENDER_NAME})).toString('base64');
try {
  // Un directorio nuevo evita publicar un bundle previo del workdir de la CLI.
  mkdirSync(path.join(temp,'supabase/functions/auth-method'),{recursive:true});
  mkdirSync(path.join(temp,'src/content'),{recursive:true});
  writeFileSync(path.join(temp,'supabase/config.toml'),'project_id = "AFCRtecnologia-auth-method"\n');
  writeFileSync(path.join(temp,'supabase/functions/auth-method/index.ts'),readFileSync('supabase/functions/auth-method/index.ts'));
  writeFileSync(path.join(temp,'src/content/auth.ts'),readFileSync('src/content/auth.ts'));
  const file=path.join(temp,'secrets.env');
  writeFileSync(file,`AFCR_MAIL_CONFIG_B64=${encoded}\n`,{mode:0o600});
  for(const args of [ ['secrets','set','--env-file',file], ['functions','deploy','auth-method','--no-verify-jwt','--use-api','--workdir',temp] ]) {
    const result=spawnSync(path.resolve('node_modules/.bin/supabase'),[...args,'--project-ref','zuqxtogggkundznzwulg'],{env,encoding:'utf8'});
    // Los resultados de secretos pueden cambiar de formato; no emitir su salida.
    if(result.status!==0) throw new Error('La CLI no pudo desplegar el control de acceso.');
  }
  console.log('Control de método desplegado. Los secretos SMTP se guardaron en Supabase sin imprimirse.');
} finally {rmSync(temp,{recursive:true,force:true});}
