-- Add unique constraint on agent_questionnaires.user_id to prevent duplicates
ALTER TABLE public.agent_questionnaires 
ADD CONSTRAINT agent_questionnaires_user_id_unique UNIQUE (user_id);