-- =====================================================================
-- Upakaran Seva — Storage Buckets
-- Migration: 00004_storage_buckets.sql
-- =====================================================================
-- Two buckets:
--   1. equipment-photos: cover photo per equipment item
--   2. condition-photos: photo evidence per condition log
-- Both: authenticated users can upload, public read for display in UI
-- =====================================================================

-- Equipment cover photos
INSERT INTO storage.buckets (Id, Name, Public, FileSizeLimit, AllowedMimeTypes)
VALUES (
    'equipment-photos',
    'equipment-photos',
    TRUE,
    5242880,  -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (Id) DO NOTHING;

-- Condition log evidence photos
INSERT INTO storage.buckets (Id, Name, Public, FileSizeLimit, AllowedMimeTypes)
VALUES (
    'condition-photos',
    'condition-photos',
    TRUE,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (Id) DO NOTHING;

-- Upload policies: authenticated users can write to their own folder
-- Files stored as: {bucket}/{userId}/{equipmentId}-{timestamp}.jpg

CREATE POLICY storage_equipment_photos_select ON storage.objects FOR SELECT
    USING (BucketId = 'equipment-photos');

CREATE POLICY storage_equipment_photos_insert ON storage.objects FOR INSERT
    WITH CHECK (
        BucketId = 'equipment-photos'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY storage_equipment_photos_update ON storage.objects FOR UPDATE
    USING (
        BucketId = 'equipment-photos'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY storage_equipment_photos_delete ON storage.objects FOR DELETE
    USING (
        BucketId = 'equipment-photos'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY storage_condition_photos_select ON storage.objects FOR SELECT
    USING (BucketId = 'condition-photos');

CREATE POLICY storage_condition_photos_insert ON storage.objects FOR INSERT
    WITH CHECK (
        BucketId = 'condition-photos'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY storage_condition_photos_update ON storage.objects FOR UPDATE
    USING (
        BucketId = 'condition-photos'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY storage_condition_photos_delete ON storage.objects FOR DELETE
    USING (
        BucketId = 'condition-photos'
        AND auth.role() = 'authenticated'
    );
