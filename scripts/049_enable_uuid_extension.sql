-- Enable uuid-ossp extension for uuid_generate_v4()
-- This is required by the handle_new_user trigger

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify the extension is enabled
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp')
    THEN '✓ uuid-ossp extension enabled successfully'
    ELSE '❌ uuid-ossp extension NOT enabled'
  END as status;
