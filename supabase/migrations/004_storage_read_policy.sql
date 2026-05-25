-- Allow authenticated users to read objects
-- in the pdfs bucket under their own user_id folder

create policy "pdfs_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'pdfs'
  and (storage.foldername(name))[1] = auth.uid()::text
);
