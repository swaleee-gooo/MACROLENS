create policy "Users delete their own meal photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'meal-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
