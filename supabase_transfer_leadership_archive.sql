begin;

do $migration_check$
begin
	if to_regclass('public."TASKHISTORY"') is null then
		raise exception 'Apply supabase_project_status.sql first; TASKHISTORY is required for safe leadership transfer';
	end if;
end;
$migration_check$;

create table if not exists "MEMBERSHIP_HISTORY_ARCHIVE" (
	"archiveId" bigint generated always as identity primary key,
	"grpId" integer not null,
	"userId" uuid not null,
	"grpmemId" text not null,
	"sourceTable" text not null,
	"record" jsonb not null,
	"archivedAt" timestamptz not null default now()
);

alter table "MEMBERSHIP_HISTORY_ARCHIVE" enable row level security;
revoke all on table "MEMBERSHIP_HISTORY_ARCHIVE" from anon, authenticated;

create table if not exists "REPUTATIONHISTORY" (
	"historyId" bigint generated always as identity primary key,
	"grpId" integer not null,
	"userId" uuid not null,
	"sourceEvalId" text,
	"projId" bigint,
	"evalRemarks" text,
	"confirmed" boolean,
	"archivedAt" timestamptz not null default now()
);

alter table "REPUTATIONHISTORY"
add column if not exists "sourceEvalId" text;

alter table "REPUTATIONHISTORY" enable row level security;
revoke all on table "REPUTATIONHISTORY" from anon, authenticated;
grant select on table "REPUTATIONHISTORY" to authenticated;

create unique index if not exists "REPUTATIONHISTORY_sourceEvalId_idx"
on "REPUTATIONHISTORY" ("sourceEvalId")
where "sourceEvalId" is not null;

drop policy if exists "Group members can read reputation history" on "REPUTATIONHISTORY";
create policy "Group members can read reputation history"
on "REPUTATIONHISTORY"
for select
to authenticated
using (
	auth.uid() = "userId"
	or exists (
		select 1
		from "GROUPMEMBER" viewer
		where viewer."userId" = auth.uid()
		  and viewer."grpId" = "REPUTATIONHISTORY"."grpId"
	) or exists (
		select 1
		from "GROUP" g
		where g."grpId" = "REPUTATIONHISTORY"."grpId"
		  and g."teacherId" = auth.uid()
	)
);

insert into "REPUTATIONHISTORY" ("grpId", "userId", "sourceEvalId", "projId", "evalRemarks", "confirmed", "archivedAt")
select
	a."grpId",
	a."userId",
	a."record"->>'evalId',
	nullif(a."record"->>'projId', '')::bigint,
	a."record"->>'evalRemarks',
	nullif(a."record"->>'confirmed', '')::boolean,
	a."archivedAt"
from "MEMBERSHIP_HISTORY_ARCHIVE" a
where a."sourceTable" = 'PEEREVAL'
on conflict do nothing;

create or replace function public.transfer_leadership(
	p_grp_id integer,
	p_new_leader_user_id uuid,
	p_old_leader_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
	v_leader_role_id "ROLE"."roleId"%type;
	v_old_grpmem_id "GROUPMEMBER"."grpmemId"%type;
	v_old_role_name text;
	v_new_grpmem_id "GROUPMEMBER"."grpmemId"%type;
begin
	if auth.uid() is distinct from p_old_leader_user_id then
		raise exception 'Only the current leader or group teacher can transfer leadership';
	end if;

	if p_new_leader_user_id = p_old_leader_user_id then
		raise exception 'The new leader must be a different group member';
	end if;

	select "roleId" into v_leader_role_id
	from "ROLE"
	where lower("roleName") = 'leader'
	limit 1;

	if v_leader_role_id is null then
		raise exception 'Leader role is not configured';
	end if;

	select gm."grpmemId", r."roleName"
	into v_old_grpmem_id, v_old_role_name
	from "GROUPMEMBER" gm
	left join "ROLE" r on r."roleId" = gm."roleId"
	where gm."userId" = p_old_leader_user_id
	  and gm."grpId" = p_grp_id
	for update of gm;

	if v_old_grpmem_id is null
	   and not exists (
			select 1
			from "GROUP"
			where "grpId" = p_grp_id
			  and "teacherId" = p_old_leader_user_id
		) then
		raise exception 'The current leader or group teacher is not authorized to transfer leadership';
	end if;

	if v_old_grpmem_id is not null
	   and lower(coalesce(v_old_role_name, '')) <> 'leader'
	   and not exists (
			select 1
			from "GROUP"
			where "grpId" = p_grp_id
			  and "teacherId" = p_old_leader_user_id
		) then
		raise exception 'Only the current leader or group teacher can transfer leadership';
	end if;

	select "grpmemId" into v_new_grpmem_id
	from "GROUPMEMBER"
	where "userId" = p_new_leader_user_id
	  and "grpId" = p_grp_id
	for update;

	if v_new_grpmem_id is null then
		raise exception 'The selected new leader is not a member of this group';
	end if;

	if v_old_grpmem_id is not null then
		insert into "TASKHISTORY" ("userId", "taskId", "statId", "assignedAt", "projId", "taskDueD", "submittedAt")
		select
			gm."userId",
			ta."taskId",
			t."statId",
			coalesce(ta."assignedAt", now()),
			t."projId",
			t."taskDueD",
			submission."submittedAt"
		from "TASKASSIGNMENT" ta
		join "GROUPMEMBER" gm on gm."grpmemId" = ta."grpmemId"
		join "TASK" t on t."taskId" = ta."taskId"
		left join lateral (
			select s."submittedAt"
			from "SUBMISSION" s
			where s."taskId" = ta."taskId"
			  and s."grpmemId" = ta."grpmemId"
			order by s."submittedAt" desc nulls last
			limit 1
		) submission on true
		where ta."grpmemId" = v_old_grpmem_id
		on conflict ("userId", "taskId") do update
		set "statId" = excluded."statId",
			"assignedAt" = excluded."assignedAt",
			"projId" = excluded."projId",
			"taskDueD" = excluded."taskDueD",
			"submittedAt" = excluded."submittedAt";

		insert into "MEMBERSHIP_HISTORY_ARCHIVE" ("grpId", "userId", "grpmemId", "sourceTable", "record")
		select p_grp_id, p_old_leader_user_id, v_old_grpmem_id::text, 'GROUPMEMBER', to_jsonb(gm)
		from "GROUPMEMBER" gm
		where gm."grpmemId" = v_old_grpmem_id;

		insert into "MEMBERSHIP_HISTORY_ARCHIVE" ("grpId", "userId", "grpmemId", "sourceTable", "record")
		select p_grp_id, p_old_leader_user_id, v_old_grpmem_id::text, 'PARTICIPATION', to_jsonb(p)
		from "PARTICIPATION" p
		where p."grpmemId" = v_old_grpmem_id;

		insert into "MEMBERSHIP_HISTORY_ARCHIVE" ("grpId", "userId", "grpmemId", "sourceTable", "record")
		select p_grp_id, p_old_leader_user_id, v_old_grpmem_id::text, 'PEEREVAL', to_jsonb(p)
		from "PEEREVAL" p
		where p."evaluatedGrpmemId" = v_old_grpmem_id;

		insert into "REPUTATIONHISTORY" ("grpId", "userId", "sourceEvalId", "projId", "evalRemarks", "confirmed")
		select p_grp_id, p_old_leader_user_id, p."evalId"::text, p."projId", p."evalRemarks", p."confirmed"
		from "PEEREVAL" p
		where p."evaluatedGrpmemId" = v_old_grpmem_id;

		insert into "MEMBERSHIP_HISTORY_ARCHIVE" ("grpId", "userId", "grpmemId", "sourceTable", "record")
		select p_grp_id, p_old_leader_user_id, v_old_grpmem_id::text, 'SUBMISSION', to_jsonb(p)
		from "SUBMISSION" p
		where p."grpmemId" = v_old_grpmem_id;

		insert into "MEMBERSHIP_HISTORY_ARCHIVE" ("grpId", "userId", "grpmemId", "sourceTable", "record")
		select p_grp_id, p_old_leader_user_id, v_old_grpmem_id::text, 'TASKASSIGNMENT', to_jsonb(p)
		from "TASKASSIGNMENT" p
		where p."grpmemId" = v_old_grpmem_id;

		insert into "MEMBERSHIP_HISTORY_ARCHIVE" ("grpId", "userId", "grpmemId", "sourceTable", "record")
		select p_grp_id, p_old_leader_user_id, v_old_grpmem_id::text, 'NOTIFICATION', to_jsonb(n)
		from "NOTIFICATION" n
		where n."grpmemId" = v_old_grpmem_id;

		delete from "PEEREVAL"
		where "evaluatedGrpmemId" = v_old_grpmem_id;

		delete from "PARTICIPATION"
		where "grpmemId" = v_old_grpmem_id;

		delete from "SUBMISSION"
		where "grpmemId" = v_old_grpmem_id;

		delete from "TASKASSIGNMENT"
		where "grpmemId" = v_old_grpmem_id;

		delete from "GROUPMEMBER"
		where "grpmemId" = v_old_grpmem_id;
	end if;

	update "GROUPMEMBER"
	set "roleId" = v_leader_role_id
	where "grpmemId" = v_new_grpmem_id;

end;
$function$;

revoke all on function public.transfer_leadership(integer, uuid, uuid) from public;
grant execute on function public.transfer_leadership(integer, uuid, uuid) to authenticated;

commit;
