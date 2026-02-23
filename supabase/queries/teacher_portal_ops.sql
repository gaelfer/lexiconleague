-- Teacher Portal V1 ops playbook
-- Run in Supabase SQL editor as an admin/service role.

-- 1) Pending approvals queue (oldest first)
select
  tvr.id,
  tvr.user_id,
  p.username,
  tvr.school_email,
  s.name as school_name,
  tvr.status,
  tvr.created_at,
  now() - tvr.created_at as age
from public.teacher_verification_requests tvr
left join public.profiles p on p.id = tvr.user_id
left join public.schools s on s.id = tvr.school_id
where tvr.status = 'pending'
order by tvr.created_at asc;

-- 2) Approve request
-- replace :request_id and :reviewer_user_id
update public.teacher_verification_requests
set
  status = 'approved',
  decision_reason = 'Manual approval by moderator',
  reviewed_by = :reviewer_user_id,
  reviewed_at = now(),
  updated_at = now()
where id = :request_id;

update public.profiles p
set
  account_type = 'teacher',
  teacher_approved = true,
  teacher_school_id = tvr.school_id,
  teacher_verified_at = now(),
  updated_at = now()
from public.teacher_verification_requests tvr
where tvr.id = :request_id
  and p.id = tvr.user_id;

-- 3) Reject request
-- replace :request_id and :reviewer_user_id
update public.teacher_verification_requests
set
  status = 'rejected',
  decision_reason = 'Manual rejection: could not verify institution',
  reviewed_by = :reviewer_user_id,
  reviewed_at = now(),
  updated_at = now()
where id = :request_id;

update public.profiles p
set
  account_type = 'teacher',
  teacher_approved = false,
  teacher_verified_at = null,
  updated_at = now()
from public.teacher_verification_requests tvr
where tvr.id = :request_id
  and p.id = tvr.user_id;

-- 4) Pending approval latency metrics (last 30 days)
select
  date_trunc('day', created_at) as day,
  count(*) filter (where status = 'pending') as pending_count,
  avg(extract(epoch from (coalesce(reviewed_at, now()) - created_at)) / 3600.0) filter (where status in ('approved','rejected','auto_approved')) as avg_review_hours
from public.teacher_verification_requests
where created_at >= now() - interval '30 days'
group by 1
order by 1;

-- 5) Activation funnel (last 30 days)
with signup as (
  select user_id, min(created_at) as started_at
  from public.teacher_verification_requests
  where created_at >= now() - interval '30 days'
  group by user_id
),
approved as (
  select user_id, min(reviewed_at) as approved_at
  from public.teacher_verification_requests
  where status in ('approved','auto_approved')
  group by user_id
),
classes as (
  select teacher_user_id as user_id, min(created_at) as first_class_at
  from public.classes
  group by teacher_user_id
)
select
  count(*) as verification_started,
  count(*) filter (where approved.approved_at is not null) as verification_approved,
  count(*) filter (where classes.first_class_at is not null) as created_first_class
from signup
left join approved using (user_id)
left join classes using (user_id);
