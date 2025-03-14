# Migrating to Supabase

This document outlines the steps to migrate OpenHands from file-based storage to Supabase.

## Prerequisites

1. A Supabase account and project
2. Supabase URL and API key

## Setup Supabase Tables

Create the following tables in your Supabase project:

### 1. Conversations Table

```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  github_user_id TEXT,
  selected_repository TEXT,
  selected_branch TEXT,
  title TEXT,
  last_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Indexes for efficient querying
  CONSTRAINT conversations_github_user_id_idx UNIQUE (github_user_id, id)
);

-- Row-level security policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid()::text = github_user_id);

CREATE POLICY "Users can insert their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid()::text = github_user_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid()::text = github_user_id);

CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (auth.uid()::text = github_user_id);
```

### 2. Settings Table

```sql
CREATE TABLE settings (
  user_id TEXT PRIMARY KEY,
  settings JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Row-level security policies
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON settings FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own settings"
  ON settings FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own settings"
  ON settings FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own settings"
  ON settings FOR DELETE
  USING (auth.uid()::text = user_id);
```

### 3. Feedback Table

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT NOT NULL,
  email TEXT NOT NULL,
  polarity TEXT NOT NULL,
  permissions TEXT NOT NULL,
  trajectory JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Row-level security policies
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
  ON feedback FOR SELECT
  USING (auth.uid()::text = email);

CREATE POLICY "Users can insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);
```

## Environment Configuration

Add the following environment variables to your `.env` file:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
USE_SUPABASE_STORAGE=true
```

## Migration Process

1. Install dependencies:
   ```
   poetry install
   ```

2. Run the migration script:
   ```
   python -m openhands.scripts.migrate_to_supabase
   ```

3. To run in dry-run mode (no data will be written):
   ```
   python -m openhands.scripts.migrate_to_supabase --dry-run
   ```

## Rollback Process

If you need to rollback to file-based storage:

1. Set `USE_SUPABASE_STORAGE=false` in your `.env` file
2. Restart the application

## Verification

After migration, verify that:

1. All conversations are accessible
2. User settings are preserved
3. Feedback submission works correctly

## Troubleshooting

- Check migration logs in the `migration_report_*.json` file
- Verify Supabase connection settings
- Ensure proper permissions are set in Supabase
