    -- Políticas de Storage para o bucket challenge-images
    -- Execute este SQL no SQL Editor do Supabase Dashboard

    -- Permitir que qualquer pessoa leia as imagens (público)
    CREATE POLICY "Public read challenge images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'challenge-images');

    -- Permitir que usuários autenticados façam upload
    CREATE POLICY "Authenticated users can upload challenge images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'challenge-images');

    -- Permitir que usuários autenticados atualizem (upsert)
    CREATE POLICY "Authenticated users can update challenge images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'challenge-images');

    -- Permitir que usuários autenticados deletem
    CREATE POLICY "Authenticated users can delete challenge images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'challenge-images');
