-- Aplicar únicamente después de desplegar welcome-email y comprobar SMTP sin enviar.
do $$ begin
  if not exists(select 1 from cron.job where jobname='afcr-welcome-emails') then
    raise exception 'WELCOME_JOB_MISSING';
  end if;
end $$;
select cron.alter_job(job_id:=jobid,active:=true) from cron.job where jobname='afcr-welcome-emails';
