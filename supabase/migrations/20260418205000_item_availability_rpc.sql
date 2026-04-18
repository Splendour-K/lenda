create or replace function get_item_availability(p_item_id uuid)
returns table(start_date date, end_date date) as $$
begin
  return query
  select t.start_date, t.end_date
  from public.transactions t
  where t.item_id = p_item_id
    and t.status in ('Requested', 'Accepted', 'Ongoing', 'Delivered');
end;
$$ language plpgsql security definer;
