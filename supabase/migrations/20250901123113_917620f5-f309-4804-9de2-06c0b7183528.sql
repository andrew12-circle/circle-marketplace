-- Fix infinite recursion in compliance_team_members policies
-- Drop the problematic policies that cause circular references
DROP POLICY IF EXISTS "Compliance members can view team" ON compliance_team_members;
DROP POLICY IF EXISTS "compliance_team_members_select_policy" ON compliance_team_members;
DROP POLICY IF EXISTS "compliance_team_members_insert_policy" ON compliance_team_members;
DROP POLICY IF EXISTS "compliance_team_members_update_policy" ON compliance_team_members;
DROP POLICY IF EXISTS "compliance_team_members_delete_policy" ON compliance_team_members;

-- Create simplified, non-recursive policies
CREATE POLICY "Admins can manage compliance team members"
ON compliance_team_members
FOR ALL
USING (get_user_admin_status())
WITH CHECK (get_user_admin_status());

CREATE POLICY "Authenticated users can view compliance team"
ON compliance_team_members
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their own compliance team membership"
ON compliance_team_members
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);