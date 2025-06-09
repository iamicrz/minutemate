-- Upsert a professional profile by user_id
-- Usage: select * from upsert_professional_profile(
--   _user_id text, _title text, _category text, _bio text, _credentials text, _experience text, _is_verified boolean, _rate_per_15min numeric
-- )
create or replace function upsert_professional_profile(
  _user_id text,
  _title text,
  _category text,
  _bio text,
  _credentials text,
  _experience text,
  _is_verified boolean,
  _rate_per_15min numeric
)
returns setof professional_profiles as $$
begin
  return query
    insert into professional_profiles (
      user_id, title, category, bio, credentials, experience, is_verified, rate_per_15min
    ) values (
      _user_id, _title, _category, _bio, _credentials, _experience, _is_verified, _rate_per_15min
    )
    on conflict (user_id) do update set
      title = excluded.title,
      category = excluded.category,
      bio = excluded.bio,
      credentials = excluded.credentials,
      experience = excluded.experience,
      is_verified = excluded.is_verified,
      rate_per_15min = excluded.rate_per_15min
    returning *;
end;
$$ language plpgsql security definer;
