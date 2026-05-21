create extension if not exists vector;

create table documents (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    file_path text not null,
    file_size integer not null,
    page_count integer,
    status text not null check (status in ('processing', 'ready', 'failed')),
    created_at timestamptz default now()
);

create table chunks (
    id uuid primary key default gen_random_uuid(),
    document_id uuid not null references documents(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    content text not null,
    page_number integer not null,
    chunk_index integer not null,
    char_start integer not null,
    char_end integer not null,
    embedding vector(1536),
    created_at timestamptz default now()
);

create table messages (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    document_id uuid not null references documents(id) on delete cascade,
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    sources jsonb,
    created_at timestamptz default now()
);

create table notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    document_id uuid not null references documents(id) on delete cascade,
    content text not null,
    page_number integer,
    created_at timestamptz default now()
);

alter table documents enable row level security;
alter table chunks enable row level security;
alter table messages enable row level security;
alter table notes enable row level security;

create policy "documents_policy"
on documents
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "chunks_policy"
on chunks
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "messages_policy"
on messages
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "notes_policy"
on notes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);