-- =====================================================================
-- Upakaran Seva — Seed Data
-- Migration: 00002_seed_data.sql
-- =====================================================================

-- ROLES (5 built-in templates)
INSERT INTO Roles (Id, Label, BasedOn, ShortDesc, Description, Permissions, BgColor, TextColor, SortOrder, IsBuiltIn) VALUES
('UpakaranAdmin', 'Upakaran Admin', NULL,
 'Full system access',
 'Complete control over all equipment operations, masters management, user/role assignment, and retire decisions.',
 '["Manage all masters","Add/edit/retire equipment","Process all checkouts and returns","Manage maintenance tickets","Assign roles to users","View billing and reports"]'::jsonb,
 'rgba(200, 96, 28, 0.12)', '#A54E14', 1, TRUE),

('UpakaranCustodian', 'Upakaran Custodian', NULL,
 'Operations & maintenance lead',
 'Manages day-to-day equipment operations: checkouts, returns, condition reports, and maintenance ticket lifecycle.',
 '["Add/edit equipment","Process checkouts and returns","Open and manage maintenance tickets","Manage locations","Assign vendors to repairs"]'::jsonb,
 'rgba(217, 119, 6, 0.12)', '#92400E', 2, TRUE),

('EventCoordinator', 'Event Coordinator', NULL,
 'Plans and runs events',
 'Coordinates event planning, equipment checklist preparation, and bulk start/close operations for events.',
 '["Create and edit events","Build event equipment checklists","Start and close events (bulk operations)","Process individual checkouts","View equipment availability"]'::jsonb,
 'rgba(13, 148, 136, 0.12)', '#0F766E', 3, TRUE),

('MediaTeamMember', 'Media Team Member', NULL,
 'Field-level user',
 'Frontline media team member who checks out equipment for shoots and reports condition observations.',
 '["Check out equipment","Report equipment condition","View assigned events","View equipment list"]'::jsonb,
 'rgba(22, 163, 74, 0.12)', '#15803D', 4, TRUE),

('UpakaranViewer', 'Upakaran Viewer', NULL,
 'Read-only oversight',
 'View-only access for trustees, auditors, and oversight roles. Cannot perform any write actions.',
 '["View all equipment","View checkout history","View events","View maintenance records","View billing summaries"]'::jsonb,
 'rgba(115, 115, 115, 0.12)', '#525252', 5, TRUE);

-- CATEGORIES (11 standard equipment categories)
INSERT INTO Categories (Id, Name, Description, HasSizeVariants, SortOrder) VALUES
('CAM', 'Cameras', 'DSLR, mirrorless, video cameras', FALSE, 1),
('MRL', 'Memory & Recording', 'Memory cards, SSDs, recorders', FALSE, 2),
('LNS', 'Lenses', 'Camera lenses (prime + zoom)', FALSE, 3),
('AUD', 'Audio Equipment', 'Microphones, mixers, audio recorders', FALSE, 4),
('LIT', 'Lighting', 'LED panels, softboxes, light stands', FALSE, 5),
('SPT', 'Support', 'Tripods, gimbals, sliders, jibs', FALSE, 6),
('STG', 'Storage', 'Hard cases, dry boxes, cabinets', FALSE, 7),
('MON', 'Monitors', 'Field monitors, reference monitors', FALSE, 8),
('DRN', 'Drones', 'UAVs and accessories', FALSE, 9),
('ACC', 'Accessories', 'Misc accessories', FALSE, 10),
('CBL', 'Cables', 'Audio/video/power cables (multi-size)', TRUE, 11);

-- EVENT TYPES (6 standard types)
INSERT INTO EventTypes (Name, Emoji, Description, SortOrder) VALUES
('Discourse', '🎤', 'Live discourse by Swamiji or speakers', 1),
('Satsang', '🕉️', 'Group satsang gatherings', 2),
('Podcast', '🎙️', 'Podcast recording sessions', 3),
('Shoot', '📹', 'Video shoots and content production', 4),
('Rehearsal', '🎬', 'Pre-event rehearsals', 5),
('Other', '📅', 'Miscellaneous events', 6);

-- =====================================================================
-- NOTE: Users, Locations, Vendors are NOT seeded here.
-- They will be created through the app by the first admin after login.
-- The first admin user is created manually in Supabase Auth + Users table
-- (see README.md "First Admin Setup" section).
-- =====================================================================
