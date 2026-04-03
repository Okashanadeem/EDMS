-- Migration: Add Signature Support to Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_path TEXT;
