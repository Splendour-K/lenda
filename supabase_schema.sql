-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  name text not null,
  avatar text,
  phone_number text,
  is_verified boolean default false,
  rating numeric(3,2) default null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ITEMS TABLE
create table public.items (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  category text not null check (category in ('Suit', 'Shoes')),
  size text not null,
  fit_description text,
  condition text not null,
  price numeric not null,
  extra_day_price numeric not null,
  deposit numeric not null,
  images text[] not null default '{}',
  status text not null default 'Available' check (status in ('Available', 'Rented', 'Hidden')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TRANSACTIONS TABLE
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  item_id uuid references public.items(id) on delete restrict not null,
  borrower_id uuid references public.users(id) on delete restrict not null,
  status text not null default 'Requested' check (status in ('Requested', 'Accepted', 'Ongoing', 'Returned', 'Rejected', 'Disputed')),
  start_date date not null,
  end_date date not null,
  total_price numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- REVIEWS TABLE
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  transaction_id uuid references public.transactions(id) on delete cascade not null,
  reviewer_id uuid references public.users(id) on delete cascade not null,
  reviewee_id uuid references public.users(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES (Row Level Security)

-- Users table policies
alter table public.users enable row level security;
create policy "Public profiles are viewable by everyone." on public.users for select using (true);
create policy "Users can update own profile." on public.users for update using (auth.uid() = id);
create policy "Users can insert their own profile." on public.users for insert with check (auth.uid() = id);

-- Items table policies
alter table public.items enable row level security;
create policy "Items are viewable by everyone." on public.items for select using (true);
create policy "Users can insert their own items." on public.items for insert with check (auth.uid() = owner_id);
create policy "Users can update their own items." on public.items for update using (auth.uid() = owner_id);

-- Transactions table policies
alter table public.transactions enable row level security;
create policy "Transactions are viewable by participants." on public.transactions for select using (auth.uid() = borrower_id or auth.uid() in (select owner_id from public.items where id = item_id));
create policy "Borrower can insert transaction." on public.transactions for insert with check (auth.uid() = borrower_id);
create policy "Participants can update transaction." on public.transactions for update using (auth.uid() = borrower_id or auth.uid() in (select owner_id from public.items where id = item_id));

-- Reviews table policies
alter table public.reviews enable row level security;
create policy "Reviews are viewable by everyone." on public.reviews for select using (true);
create policy "Users can insert reviews for themselves." on public.reviews for insert with check (auth.uid() = reviewer_id);
