
-- 1) Add multi-recipient alert emails to services (array, default empty)
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS consultation_emails text[] NOT NULL DEFAULT '{}'::text[];

-- 2) Validation trigger to enforce max 4 emails and basic email format
CREATE OR REPLACE FUNCTION public.validate_consultation_emails_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.consultation_emails IS NOT NULL THEN
    -- Normalize/trim to clean entries
    NEW.consultation_emails :=
      ARRAY(
        SELECT lower(trim(e))
        FROM unnest(NEW.consultation_emails) AS e
        WHERE trim(e) <> ''
      );

    -- Enforce max 4
    IF array_length(NEW.consultation_emails, 1) > 4 THEN
      RAISE EXCEPTION 'Too many consultation emails (max 4)';
    END IF;

    -- Validate basic email format
    IF EXISTS (
      SELECT 1
      FROM unnest(NEW.consultation_emails) AS e
      WHERE e !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
    ) THEN
      RAISE EXCEPTION 'One or more consultation emails have invalid format';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_validate_consultation_emails ON public.services;

CREATE TRIGGER trg_validate_consultation_emails
BEFORE INSERT OR UPDATE OF consultation_emails ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.validate_consultation_emails_trigger();
