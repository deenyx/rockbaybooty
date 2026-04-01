-- Allow duplicate PIN values across different names.
-- Login now validates using pin + name together.
DROP INDEX IF EXISTS "User_loginPin_key";
CREATE INDEX IF NOT EXISTS "User_loginPin_idx" ON "User"("loginPin");
