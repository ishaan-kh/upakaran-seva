-- =====================================================================
-- Upakaran Seva — Row Level Security
-- Migration: 00003_rls_policies.sql
-- =====================================================================
-- Approach:
--   1. Helper functions: current_user_profile(), current_user_role_ids(),
--      has_action(action_name) — these resolve template inheritance.
--   2. Every table: SELECT open to authenticated users (read).
--   3. INSERT/UPDATE/DELETE gated by has_action() checks.
--   4. Special tables (Users, Roles) get stricter rules — only Admin manages.
-- =====================================================================

-- Helper: get the current authenticated user's profile row
CREATE OR REPLACE FUNCTION current_user_profile()
RETURNS Users
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT u.* FROM Users u WHERE u.AuthUserId = auth.uid() AND u.IsActive = TRUE LIMIT 1;
$$;

-- Helper: get list of role IDs for current user
CREATE OR REPLACE FUNCTION current_user_role_ids()
RETURNS TEXT[]
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT ARRAY(
        SELECT jsonb_array_elements_text(u.Roles)
        FROM Users u
        WHERE u.AuthUserId = auth.uid() AND u.IsActive = TRUE
    );
$$;

-- Helper: get effective built-in role IDs (resolving custom role basedOn)
CREATE OR REPLACE FUNCTION current_user_effective_roles()
RETURNS TEXT[]
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
    role_ids TEXT[];
    effective TEXT[] := ARRAY[]::TEXT[];
    rid TEXT;
    base TEXT;
BEGIN
    role_ids := current_user_role_ids();
    IF role_ids IS NULL THEN RETURN ARRAY[]::TEXT[]; END IF;

    FOREACH rid IN ARRAY role_ids LOOP
        -- Built-in role? Add directly.
        IF EXISTS (SELECT 1 FROM Roles WHERE Id = rid AND IsBuiltIn = TRUE) THEN
            effective := array_append(effective, rid);
        ELSE
            -- Custom role: resolve via BasedOn
            SELECT BasedOn INTO base FROM Roles WHERE Id = rid;
            IF base IS NOT NULL THEN
                effective := array_append(effective, base);
            END IF;
        END IF;
    END LOOP;
    RETURN effective;
END;
$$;

-- Helper: action permission check
-- Mirrors ACTION_PERMISSIONS map from the frontend
CREATE OR REPLACE FUNCTION has_action(action_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
    eff TEXT[];
    allowed TEXT[];
BEGIN
    eff := current_user_effective_roles();
    IF eff IS NULL OR array_length(eff, 1) IS NULL THEN RETURN FALSE; END IF;

    allowed := CASE action_name
        WHEN 'equipment.create'           THEN ARRAY['UpakaranAdmin','UpakaranCustodian']
        WHEN 'equipment.edit'             THEN ARRAY['UpakaranAdmin','UpakaranCustodian']
        WHEN 'equipment.retire'           THEN ARRAY['UpakaranAdmin']
        WHEN 'equipment.reportCondition'  THEN ARRAY['UpakaranAdmin','UpakaranCustodian','EventCoordinator','MediaTeamMember']
        WHEN 'checkout.create'            THEN ARRAY['UpakaranAdmin','UpakaranCustodian','EventCoordinator','MediaTeamMember']
        WHEN 'checkout.return'            THEN ARRAY['UpakaranAdmin','UpakaranCustodian']
        WHEN 'event.create'               THEN ARRAY['UpakaranAdmin','EventCoordinator']
        WHEN 'event.edit'                 THEN ARRAY['UpakaranAdmin','EventCoordinator']
        WHEN 'event.checklist'            THEN ARRAY['UpakaranAdmin','EventCoordinator','UpakaranCustodian']
        WHEN 'event.bulkOps'              THEN ARRAY['UpakaranAdmin','EventCoordinator','UpakaranCustodian']
        WHEN 'maintenance.create'         THEN ARRAY['UpakaranAdmin','UpakaranCustodian']
        WHEN 'maintenance.manage'         THEN ARRAY['UpakaranAdmin','UpakaranCustodian']
        WHEN 'masters.manage'             THEN ARRAY['UpakaranAdmin']
        ELSE ARRAY[]::TEXT[]
    END;

    RETURN eff && allowed;  -- array overlap operator
END;
$$;

-- Helper: is current user admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT 'UpakaranAdmin' = ANY(current_user_effective_roles());
$$;

-- =====================================================================
-- ENABLE RLS
-- =====================================================================
ALTER TABLE Roles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE Categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE Users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE Locations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE Vendors              ENABLE ROW LEVEL SECURITY;
ALTER TABLE EventTypes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE Equipment            ENABLE ROW LEVEL SECURITY;
ALTER TABLE Checkouts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE Events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE EventChecklistItems  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ConditionLogs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE MaintenanceTickets   ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- POLICIES — Read open to authenticated, write gated by has_action
-- =====================================================================

-- ROLES
CREATE POLICY p_roles_select ON Roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY p_roles_insert ON Roles FOR INSERT WITH CHECK (has_action('masters.manage'));
CREATE POLICY p_roles_update ON Roles FOR UPDATE USING (has_action('masters.manage')) WITH CHECK (has_action('masters.manage'));
CREATE POLICY p_roles_delete ON Roles FOR DELETE USING (has_action('masters.manage') AND IsBuiltIn = FALSE);

-- CATEGORIES
CREATE POLICY p_categories_select ON Categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY p_categories_insert ON Categories FOR INSERT WITH CHECK (has_action('masters.manage'));
CREATE POLICY p_categories_update ON Categories FOR UPDATE USING (has_action('masters.manage')) WITH CHECK (has_action('masters.manage'));
CREATE POLICY p_categories_delete ON Categories FOR DELETE USING (has_action('masters.manage'));

-- USERS — SELECT open; WRITE admin-only; users can update their own profile
CREATE POLICY p_users_select ON Users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY p_users_insert ON Users FOR INSERT WITH CHECK (is_admin());
CREATE POLICY p_users_update_admin ON Users FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY p_users_update_self  ON Users FOR UPDATE USING (AuthUserId = auth.uid()) WITH CHECK (AuthUserId = auth.uid());
CREATE POLICY p_users_delete ON Users FOR DELETE USING (is_admin());

-- LOCATIONS
CREATE POLICY p_locations_select ON Locations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY p_locations_insert ON Locations FOR INSERT WITH CHECK (has_action('masters.manage'));
CREATE POLICY p_locations_update ON Locations FOR UPDATE USING (has_action('masters.manage')) WITH CHECK (has_action('masters.manage'));
CREATE POLICY p_locations_delete ON Locations FOR DELETE USING (has_action('masters.manage'));

-- VENDORS
CREATE POLICY p_vendors_select ON Vendors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY p_vendors_insert ON Vendors FOR INSERT WITH CHECK (has_action('masters.manage'));
CREATE POLICY p_vendors_update ON Vendors FOR UPDATE USING (has_action('masters.manage')) WITH CHECK (has_action('masters.manage'));
CREATE POLICY p_vendors_delete ON Vendors FOR DELETE USING (has_action('masters.manage'));

-- EVENT TYPES
CREATE POLICY p_eventtypes_select ON EventTypes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY p_eventtypes_insert ON EventTypes FOR INSERT WITH CHECK (has_action('masters.manage'));
CREATE POLICY p_eventtypes_update ON EventTypes FOR UPDATE USING (has_action('masters.manage')) WITH CHECK (has_action('masters.manage'));
CREATE POLICY p_eventtypes_delete ON EventTypes FOR DELETE USING (has_action('masters.manage'));

-- EQUIPMENT
CREATE POLICY p_equipment_select ON Equipment FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY p_equipment_insert ON Equipment FOR INSERT WITH CHECK (has_action('equipment.create'));
CREATE POLICY p_equipment_update ON Equipment FOR UPDATE USING (has_action('equipment.edit') OR has_action('equipment.retire')) WITH CHECK (has_action('equipment.edit') OR has_action('equipment.retire'));
CREATE POLICY p_equipment_delete ON Equipment FOR DELETE USING (is_admin());

-- CHECKOUTS
CREATE POLICY p_checkouts_select ON Checkouts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY p_checkouts_insert ON Checkouts FOR INSERT WITH CHECK (has_action('checkout.create'));
CREATE POLICY p_checkouts_update ON Checkouts FOR UPDATE USING (has_action('checkout.return')) WITH CHECK (has_action('checkout.return'));
CREATE POLICY p_checkouts_delete ON Checkouts FOR DELETE USING (is_admin());

-- EVENTS
CREATE POLICY p_events_select ON Events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY p_events_insert ON Events FOR INSERT WITH CHECK (has_action('event.create'));
CREATE POLICY p_events_update ON Events FOR UPDATE USING (has_action('event.edit') OR has_action('event.bulkOps')) WITH CHECK (has_action('event.edit') OR has_action('event.bulkOps'));
CREATE POLICY p_events_delete ON Events FOR DELETE USING (is_admin());

-- EVENT CHECKLIST ITEMS
CREATE POLICY p_checklist_select ON EventChecklistItems FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY p_checklist_insert ON EventChecklistItems FOR INSERT WITH CHECK (has_action('event.checklist'));
CREATE POLICY p_checklist_update ON EventChecklistItems FOR UPDATE USING (has_action('event.checklist') OR has_action('event.bulkOps')) WITH CHECK (has_action('event.checklist') OR has_action('event.bulkOps'));
CREATE POLICY p_checklist_delete ON EventChecklistItems FOR DELETE USING (has_action('event.checklist'));

-- CONDITION LOGS — anyone with reportCondition can insert
CREATE POLICY p_conditionlogs_select ON ConditionLogs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY p_conditionlogs_insert ON ConditionLogs FOR INSERT WITH CHECK (has_action('equipment.reportCondition'));
-- No update/delete by design — condition logs are immutable history

-- MAINTENANCE TICKETS
CREATE POLICY p_maintenance_select ON MaintenanceTickets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY p_maintenance_insert ON MaintenanceTickets FOR INSERT WITH CHECK (has_action('maintenance.create'));
CREATE POLICY p_maintenance_update ON MaintenanceTickets FOR UPDATE USING (has_action('maintenance.manage')) WITH CHECK (has_action('maintenance.manage'));
CREATE POLICY p_maintenance_delete ON MaintenanceTickets FOR DELETE USING (is_admin());
