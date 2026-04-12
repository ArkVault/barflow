-- Create table for storing operations layout
create table if not exists public.operations_layout (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  sections jsonb not null default '[]'::jsonb,
  table_counter integer not null default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Enable RLS
alter table public.operations_layout enable row level security;

-- Create policies
create policy "Users can view their own layout"
  on public.operations_layout for select
  using (auth.uid() = user_id);

create policy "Users can insert their own layout"
  on public.operations_layout for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own layout"
  on public.operations_layout for update
  using (auth.uid() = user_id);

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger set_updated_at
  before update on public.operations_layout
  for each row
  execute function public.handle_updated_at();
