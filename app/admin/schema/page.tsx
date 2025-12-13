import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Database, CheckCircle, XCircle, AlertTriangle, ExternalLink } from "lucide-react"
import { CopyButton } from "./copy-button"

// SQL queries for schema extraction (to run in Supabase SQL Editor)
const SCHEMA_QUERIES = {
  tables_columns: `-- 1. TABLES & COLUMNS
SELECT
  c.table_name,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.column_default,
  c.is_nullable,
  c.character_maximum_length
FROM information_schema.columns c
JOIN information_schema.tables t
  ON c.table_name = t.table_name
  AND c.table_schema = t.table_schema
WHERE c.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY c.table_name, c.ordinal_position;`,

  functions: `-- 2. FUNCTIONS
SELECT
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;`,

  triggers_public: `-- 3. TRIGGERS (Public Schema)
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;`,

  triggers_auth: `-- 4. TRIGGERS (Auth Schema - Critical!)
SELECT
  t.tgname AS trigger_name,
  c.relname AS table_name,
  pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth'
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;`,

  policies: `-- 5. RLS POLICIES
SELECT
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;`,

  indexes: `-- 6. INDEXES
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey'
ORDER BY tablename, indexname;`,

  enums: `-- 7. ENUMS
SELECT
  t.typname AS enum_name,
  e.enumlabel AS enum_value,
  e.enumsortorder
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;`,

  constraints: `-- 8. CONSTRAINTS (Foreign Keys, Unique, Check)
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.check_constraints cc
  ON cc.constraint_name = tc.constraint_name
  AND cc.constraint_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type != 'PRIMARY KEY'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;`,

  all_combined: `-- COMPLETE SCHEMA EXTRACTION
-- Run each section separately or all at once

-- ============================================
-- 1. TABLES & COLUMNS
-- ============================================
SELECT
  'TABLE' AS object_type,
  c.table_name,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.column_default,
  c.is_nullable
FROM information_schema.columns c
JOIN information_schema.tables t
  ON c.table_name = t.table_name
  AND c.table_schema = t.table_schema
WHERE c.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY c.table_name, c.ordinal_position;

-- ============================================
-- 2. FUNCTIONS (Full definitions)
-- ============================================
SELECT
  'FUNCTION' AS object_type,
  p.proname AS name,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

-- ============================================
-- 3. TRIGGERS (Public + Auth)
-- ============================================
SELECT
  'TRIGGER_PUBLIC' AS object_type,
  trigger_name,
  event_object_table,
  action_timing || ' ' || event_manipulation AS timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';

SELECT
  'TRIGGER_AUTH' AS object_type,
  t.tgname AS trigger_name,
  c.relname AS table_name,
  pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND NOT t.tgisinternal;

-- ============================================
-- 4. RLS POLICIES
-- ============================================
SELECT
  'POLICY' AS object_type,
  tablename,
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public';

-- ============================================
-- 5. INDEXES
-- ============================================
SELECT
  'INDEX' AS object_type,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public';

-- ============================================
-- 6. ENUMS
-- ============================================
SELECT
  'ENUM' AS object_type,
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public';

-- ============================================
-- 7. CONSTRAINTS
-- ============================================
SELECT
  'CONSTRAINT' AS object_type,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu USING (constraint_name, table_schema)
WHERE tc.table_schema = 'public';`
}

async function validateDatabase() {
  const serviceClient = createServiceRoleClient()
  const results: { name: string; status: 'ok' | 'warning' | 'error'; message: string }[] = []

  // 1. Test generate_referral_code function
  try {
    const { data, error } = await serviceClient.rpc('generate_referral_code')
    results.push({
      name: 'generate_referral_code()',
      status: error ? 'error' : 'ok',
      message: error ? error.message : `Returns: "${data}"`
    })
  } catch (e) {
    results.push({ name: 'generate_referral_code()', status: 'error', message: String(e) })
  }

  // 2. Check auth trigger by comparing auth users vs profiles
  try {
    const { data: { users } } = await serviceClient.auth.admin.listUsers({ perPage: 1000 })
    const { count: profileCount } = await serviceClient.from('profiles').select('*', { count: 'exact', head: true })

    const authCount = users?.length || 0
    const diff = authCount - (profileCount || 0)

    results.push({
      name: 'on_auth_user_created trigger',
      status: diff === 0 ? 'ok' : diff <= 2 ? 'warning' : 'error',
      message: diff === 0
        ? `All ${authCount} auth users have profiles`
        : `${diff} users missing profiles (${authCount} auth, ${profileCount} profiles)`
    })
  } catch (e) {
    results.push({ name: 'on_auth_user_created trigger', status: 'error', message: String(e) })
  }

  // 3. Test check_and_award_badges function exists
  try {
    // Call with non-existent UUID to test function exists without side effects
    const { error } = await serviceClient.rpc('check_and_award_badges', {
      p_user_id: '00000000-0000-0000-0000-000000000000'
    })
    results.push({
      name: 'check_and_award_badges(uuid)',
      status: 'ok',
      message: error ? `Exists but returned: ${error.message}` : 'Function callable'
    })
  } catch (e) {
    results.push({ name: 'check_and_award_badges(uuid)', status: 'warning', message: `May not exist: ${e}` })
  }

  // 4. Check badges are seeded
  try {
    const { count } = await serviceClient.from('badges').select('*', { count: 'exact', head: true })
    results.push({
      name: 'Badges seeded',
      status: count === 5 ? 'ok' : count && count > 0 ? 'warning' : 'error',
      message: `${count || 0} badges found (expected 5)`
    })
  } catch (e) {
    results.push({ name: 'Badges seeded', status: 'error', message: String(e) })
  }

  // 5. Check platform_statistics exists and has data
  try {
    const { data, error } = await serviceClient.from('platform_statistics').select('*').single()
    results.push({
      name: 'platform_statistics table',
      status: error ? 'error' : 'ok',
      message: error ? error.message : `Members: ${data?.total_members}, Votes: ${data?.total_votes}`
    })
  } catch (e) {
    results.push({ name: 'platform_statistics table', status: 'error', message: String(e) })
  }

  return results
}

async function getTableCounts() {
  const serviceClient = createServiceRoleClient()
  const tables = ['profiles', 'supporters', 'referrals', 'votes', 'user_votes', 'badges', 'user_badges', 'activities', 'platform_statistics']

  const counts: { table: string; count: number; error?: string }[] = []

  for (const table of tables) {
    try {
      const { count, error } = await serviceClient.from(table).select('*', { count: 'exact', head: true })
      counts.push({ table, count: count || 0, error: error?.message })
    } catch (e) {
      counts.push({ table, count: 0, error: String(e) })
    }
  }

  return counts
}

function QueryBlock({ title, query, id }: { title: string; query: string; id: string }) {
  return (
    <div className="rounded-lg border border-white/10 overflow-hidden" id={id}>
      <div className="bg-white/10 px-4 py-2 flex items-center justify-between">
        <span className="font-semibold">{title}</span>
        <CopyButton text={query} />
      </div>
      <pre className="p-4 text-xs overflow-x-auto bg-black/40 max-h-64 overflow-y-auto">
        <code className="text-green-300">{query.trim()}</code>
      </pre>
    </div>
  )
}

export default async function SchemaExtractionPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
  if (!profile?.is_admin) redirect("/dashboard")

  const [validationResults, tableCounts] = await Promise.all([
    validateDatabase(),
    getTableCounts()
  ])

  const allOk = validationResults.every(r => r.status === 'ok')

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Schema Extraction & Validation</h1>
              <p className="text-sm text-white/60">Extract live schema, validate triggers, create golden snapshot</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Quick Navigation */}
        <div className="flex flex-wrap gap-2">
          <a href="#validation" className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20">Validation</a>
          <a href="#tables" className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20">Tables</a>
          <a href="#queries" className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20">SQL Queries</a>
        </div>

        {/* Instructions */}
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Database className="h-6 w-6" />
            How to Extract Complete Schema
          </h2>
          <ol className="list-decimal ml-6 space-y-2 text-sm">
            <li>Review the <strong>Validation Results</strong> below to ensure triggers are working</li>
            <li>Open <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">Supabase Dashboard <ExternalLink className="h-3 w-3" /></a> → SQL Editor</li>
            <li>Run each query from the <strong>Schema Extraction Queries</strong> section below</li>
            <li>Copy results → paste into a new file for review</li>
            <li>After review, we&apos;ll consolidate into <code className="bg-white/10 px-1 rounded">scripts/golden_schema.sql</code></li>
          </ol>
        </div>

        {/* Validation Results */}
        <div id="validation" className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            {allOk ? <CheckCircle className="h-6 w-6 text-green-400" /> : <AlertTriangle className="h-6 w-6 text-yellow-400" />}
            Trigger & Function Validation
          </h2>
          <div className="space-y-3">
            {validationResults.map((result, i) => (
              <div
                key={i}
                className={`rounded-lg border p-4 ${
                  result.status === 'ok' ? 'border-green-500/30 bg-green-500/10' :
                  result.status === 'warning' ? 'border-yellow-500/30 bg-yellow-500/10' :
                  'border-red-500/30 bg-red-500/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.status === 'ok' ? <CheckCircle className="h-5 w-5 text-green-400" /> :
                   result.status === 'warning' ? <AlertTriangle className="h-5 w-5 text-yellow-400" /> :
                   <XCircle className="h-5 w-5 text-red-400" />}
                  <span className="font-mono text-sm">{result.name}</span>
                </div>
                <p className="text-sm text-white/60 mt-1 ml-7">{result.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Table Row Counts */}
        <div id="tables" className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold mb-4">Table Row Counts</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {tableCounts.map(({ table, count, error }) => (
              <div
                key={table}
                className={`rounded-lg border p-4 ${error ? 'border-red-500/30 bg-red-500/10' : 'border-white/10 bg-white/5'}`}
              >
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-white/60 truncate">{table}</div>
                {error && <div className="text-xs text-red-400 mt-1 truncate">{error}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Schema Extraction Queries */}
        <div id="queries" className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold mb-4">Schema Extraction Queries</h2>
          <p className="text-sm text-white/60 mb-6">
            Copy each query and run in Supabase SQL Editor. Click &quot;Copy&quot; button on each block.
          </p>

          <div className="space-y-4">
            <QueryBlock
              id="q-tables"
              title="1. Tables & Columns"
              query={SCHEMA_QUERIES.tables_columns}
            />
            <QueryBlock
              id="q-functions"
              title="2. Functions (handle_new_user, etc.)"
              query={SCHEMA_QUERIES.functions}
            />
            <QueryBlock
              id="q-triggers-public"
              title="3. Triggers (Public Schema)"
              query={SCHEMA_QUERIES.triggers_public}
            />
            <QueryBlock
              id="q-triggers-auth"
              title="4. Triggers (Auth Schema - CRITICAL)"
              query={SCHEMA_QUERIES.triggers_auth}
            />
            <QueryBlock
              id="q-policies"
              title="5. RLS Policies"
              query={SCHEMA_QUERIES.policies}
            />
            <QueryBlock
              id="q-indexes"
              title="6. Indexes"
              query={SCHEMA_QUERIES.indexes}
            />
            <QueryBlock
              id="q-enums"
              title="7. Enums (user_type)"
              query={SCHEMA_QUERIES.enums}
            />
            <QueryBlock
              id="q-constraints"
              title="8. Constraints (FK, Unique, Check)"
              query={SCHEMA_QUERIES.constraints}
            />
          </div>
        </div>

        {/* All-in-One Query */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-6">
          <h2 className="text-xl font-bold mb-4">All-in-One Query (Alternative)</h2>
          <p className="text-sm text-white/60 mb-4">
            Run this single query to get everything at once. Note: Results will be in separate result sets.
          </p>
          <QueryBlock
            id="q-all"
            title="Complete Schema Export"
            query={SCHEMA_QUERIES.all_combined}
          />
        </div>

        {/* Next Steps */}
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
          <h2 className="text-xl font-bold mb-4">Next Steps After Extraction</h2>
          <ol className="list-decimal ml-6 space-y-2 text-sm">
            <li>Run all queries above in Supabase SQL Editor</li>
            <li>Copy results to a temporary file for review</li>
            <li>Verify all expected objects are present:
              <ul className="list-disc ml-6 mt-1 text-white/60">
                <li>9 tables (profiles, supporters, referrals, votes, user_votes, badges, user_badges, activities, platform_statistics)</li>
                <li>handle_new_user(), check_and_award_badges(), generate_referral_code() functions</li>
                <li>on_auth_user_created trigger on auth.users</li>
                <li>user_type enum with &apos;member&apos; and &apos;supporter&apos;</li>
              </ul>
            </li>
            <li>Consolidate into <code className="bg-white/10 px-1 rounded">scripts/golden_schema.sql</code></li>
            <li>Archive old migrations to <code className="bg-white/10 px-1 rounded">scripts/archive/</code></li>
          </ol>
        </div>
      </div>
    </div>
  )
}
