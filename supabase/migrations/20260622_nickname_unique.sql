-- Unique index on nickname (nulls allowed, only non-null values must be unique)
create unique index if not exists idx_profiles_nickname
  on public.profiles (nickname)
  where nickname is not null;
