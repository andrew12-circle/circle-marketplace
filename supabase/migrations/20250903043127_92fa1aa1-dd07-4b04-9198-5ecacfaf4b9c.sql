-- Complete the trigger creation that was missing
DROP TRIGGER IF EXISTS trg_block_direct_pro_updates ON public.profiles;
CREATE TRIGGER trg_block_direct_pro_updates
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.block_direct_pro_updates();