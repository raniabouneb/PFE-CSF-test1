-- Chat IA : persistance invité + utilisateur
-- Exécuter sur la même base que DATABASE_URL backend.

CREATE TABLE IF NOT EXISTS public.ai_conversation (
  id TEXT PRIMARY KEY,
  user_id TEXT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  guest_session_id TEXT NULL,
  external_session_id TEXT NOT NULL,
  title TEXT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  is_temporary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_conversation_user
  ON public.ai_conversation(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_guest
  ON public.ai_conversation(guest_session_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_external
  ON public.ai_conversation(external_session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_exp
  ON public.ai_conversation(expires_at)
  WHERE is_temporary = true;

CREATE TABLE IF NOT EXISTS public.ai_message (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES public.ai_conversation(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_message_conv
  ON public.ai_message(conversation_id, created_at ASC);

CREATE TABLE IF NOT EXISTS public.ai_conversation_file (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES public.ai_conversation(id) ON DELETE CASCADE,
  user_id TEXT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  guest_session_id TEXT NULL,
  file_kind TEXT NOT NULL DEFAULT 'cv',
  storage_key TEXT NOT NULL,
  original_name TEXT NULL,
  mime_type TEXT NULL,
  size_bytes BIGINT NULL,
  parsed_payload JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_file_guest ON public.ai_conversation_file(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_ai_file_user ON public.ai_conversation_file(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_file_exp ON public.ai_conversation_file(expires_at);
