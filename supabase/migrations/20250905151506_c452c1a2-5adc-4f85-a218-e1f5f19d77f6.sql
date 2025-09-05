-- Add unique constraint on agent_questionnaires.user_id to prevent duplicates
ALTER TABLE public.agent_questionnaires 
ADD CONSTRAINT agent_questionnaires_user_id_unique UNIQUE (user_id);

-- Add trigger to automatically update updated_at timestamp
CREATE TRIGGER update_agent_questionnaires_updated_at
    BEFORE UPDATE ON public.agent_questionnaires
    FOR EACH ROW
    EXECUTE FUNCTION public.update_questionnaire_updated_at();