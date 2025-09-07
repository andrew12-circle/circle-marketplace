-- Update concierge_sessions table to allow anonymous users
-- First, make user_id nullable to support anonymous sessions
ALTER TABLE public.concierge_sessions ALTER COLUMN user_id DROP NOT NULL;

-- Drop the existing restrictive policy
DROP POLICY "Users can manage their own concierge sessions" ON public.concierge_sessions;

-- Create new policies to allow anonymous sessions
CREATE POLICY "Users can manage their own authenticated concierge sessions"
  ON public.concierge_sessions
  FOR ALL
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Anyone can create anonymous concierge sessions"
  ON public.concierge_sessions
  FOR INSERT
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Anyone can view and update anonymous concierge sessions"
  ON public.concierge_sessions
  FOR ALL
  USING (user_id IS NULL);

-- Update messages policy to allow access to anonymous session messages
DROP POLICY "Users can view messages from their sessions" ON public.concierge_messages;

CREATE POLICY "Users can view messages from their authenticated sessions"
  ON public.concierge_messages
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.concierge_sessions
    WHERE concierge_sessions.id = concierge_messages.session_id
    AND concierge_sessions.user_id = auth.uid()
    AND auth.uid() IS NOT NULL
  ));

CREATE POLICY "Anyone can view messages from anonymous sessions"
  ON public.concierge_messages
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.concierge_sessions
    WHERE concierge_sessions.id = concierge_messages.session_id
    AND concierge_sessions.user_id IS NULL
  ));