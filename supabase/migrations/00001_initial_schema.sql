-- =====================================================================
-- Upakaran Seva — Initial Schema
-- Migration: 00001_initial_schema.sql
-- =====================================================================
-- Convention: PascalCase for tables and columns
-- All FKs use UUID for entities, TEXT for code-like IDs (Roles, Categories)
-- Photo storage: URLs reference Supabase Storage bucket 'equipment-photos'
-- =====================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- ROLES (5 built-in + custom)
-- =====================================================================
CREATE TABLE Roles (
    Id           TEXT        PRIMARY KEY,
    Label        TEXT        NOT NULL UNIQUE,
    BasedOn      TEXT        REFERENCES Roles(Id) ON DELETE RESTRICT,
    ShortDesc    TEXT        DEFAULT '',
    Description  TEXT        DEFAULT '',
    Permissions  JSONB       DEFAULT '[]'::jsonb,
    BgColor      TEXT        DEFAULT 'var(--s2)',
    TextColor    TEXT        DEFAULT 'var(--tm)',
    SortOrder    INTEGER     DEFAULT 0,
    IsBuiltIn    BOOLEAN     DEFAULT FALSE,
    CreatedAt    TIMESTAMPTZ DEFAULT NOW(),
    UpdatedAt    TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- CATEGORIES (Equipment categories — code-keyed)
-- =====================================================================
CREATE TABLE Categories (
    Id                TEXT        PRIMARY KEY,        -- e.g. 'CAM', 'MRL', 'CBL'
    Name              TEXT        NOT NULL UNIQUE,
    Description       TEXT        DEFAULT '',
    HasSizeVariants   BOOLEAN     DEFAULT FALSE,      -- TRUE for 'CBL' (cables)
    SortOrder         INTEGER     DEFAULT 0,
    CreatedAt         TIMESTAMPTZ DEFAULT NOW(),
    UpdatedAt         TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- USERS (linked to Supabase auth.users)
-- =====================================================================
CREATE TABLE Users (
    Id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    AuthUserId   UUID         UNIQUE REFERENCES auth.users(Id) ON DELETE SET NULL,
    Name         TEXT         NOT NULL,
    Email        TEXT         NOT NULL UNIQUE,
    Phone        TEXT,
    Roles        JSONB        DEFAULT '[]'::jsonb,    -- array of Role.Id strings
    IsActive     BOOLEAN      DEFAULT TRUE,
    CreatedAt    TIMESTAMPTZ  DEFAULT NOW(),
    UpdatedAt    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IDX_Users_AuthUserId ON Users(AuthUserId);
CREATE INDEX IDX_Users_IsActive   ON Users(IsActive) WHERE IsActive = TRUE;

-- =====================================================================
-- LOCATIONS (Ashram + Center storage locations)
-- =====================================================================
CREATE TABLE Locations (
    Id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    Name            TEXT         NOT NULL UNIQUE,
    Dhyanasthali    TEXT,                              -- e.g. 'Ahmedabad', 'Surat'
    Address         TEXT,
    InchargeUserId  UUID         REFERENCES Users(Id) ON DELETE SET NULL,
    Notes           TEXT         DEFAULT '',
    IsActive        BOOLEAN      DEFAULT TRUE,
    CreatedAt       TIMESTAMPTZ  DEFAULT NOW(),
    UpdatedAt       TIMESTAMPTZ  DEFAULT NOW()
);

-- =====================================================================
-- VENDORS (Suppliers + Repair shops)
-- =====================================================================
CREATE TABLE Vendors (
    Id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    Name         TEXT         NOT NULL UNIQUE,
    VendorType   TEXT         NOT NULL CHECK (VendorType IN ('Supplier', 'Repair', 'Both')),
    Gstin        TEXT,
    ContactName  TEXT,
    Phone        TEXT,
    Email        TEXT,
    Address      TEXT,
    Notes        TEXT         DEFAULT '',
    IsActive     BOOLEAN      DEFAULT TRUE,
    CreatedAt    TIMESTAMPTZ  DEFAULT NOW(),
    UpdatedAt    TIMESTAMPTZ  DEFAULT NOW()
);

-- =====================================================================
-- EVENT TYPES (Discourse, Satsang, Podcast, Shoot, etc.)
-- =====================================================================
CREATE TABLE EventTypes (
    Id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    Name         TEXT         NOT NULL UNIQUE,
    Emoji        TEXT,
    Description  TEXT         DEFAULT '',
    SortOrder    INTEGER      DEFAULT 0,
    CreatedAt    TIMESTAMPTZ  DEFAULT NOW(),
    UpdatedAt    TIMESTAMPTZ  DEFAULT NOW()
);

-- =====================================================================
-- EQUIPMENT (the core asset)
-- =====================================================================
CREATE TABLE Equipment (
    Id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    Code                TEXT         NOT NULL UNIQUE,         -- e.g. 'CAM-0001'
    Name                TEXT         NOT NULL,
    CategoryId          TEXT         NOT NULL REFERENCES Categories(Id) ON DELETE RESTRICT,
    LocationId          UUID         REFERENCES Locations(Id) ON DELETE SET NULL,
    VendorId            UUID         REFERENCES Vendors(Id) ON DELETE SET NULL,

    -- Tracking model
    TrackingType        TEXT         NOT NULL CHECK (TrackingType IN ('Individual', 'Bulk')),
    TotalQuantity       INTEGER      NOT NULL DEFAULT 1 CHECK (TotalQuantity >= 1),

    -- Size variants (for cables etc.)
    SizeVariant         TEXT,                                  -- e.g. '3m', '5m', '10m'

    -- Free-form specs
    Specs               JSONB        DEFAULT '{}'::jsonb,

    -- Photo (Supabase Storage path)
    PhotoUrl            TEXT,

    -- Current status
    CurrentGrade        CHAR(1)      CHECK (CurrentGrade IN ('A','B','C','D','E')),
    CurrentStatus       TEXT         NOT NULL DEFAULT 'Available'
                                     CHECK (CurrentStatus IN ('Available','CheckedOut','Overdue','InMaintenance','Retired')),

    -- Purchase / warranty / AMC
    PurchaseDate        DATE,
    PurchasePrice       NUMERIC(12,2),
    WarrantyEndDate     DATE,
    AmcVendorId         UUID         REFERENCES Vendors(Id) ON DELETE SET NULL,
    AmcStartDate        DATE,
    AmcEndDate          DATE,
    AmcCost             NUMERIC(12,2),

    -- Lifecycle
    IsActive            BOOLEAN      DEFAULT TRUE,
    RetiredAt           TIMESTAMPTZ,
    RetiredReason       TEXT,
    RetiredByUserId     UUID         REFERENCES Users(Id) ON DELETE SET NULL,

    CreatedAt           TIMESTAMPTZ  DEFAULT NOW(),
    UpdatedAt           TIMESTAMPTZ  DEFAULT NOW(),
    CreatedByUserId     UUID         REFERENCES Users(Id) ON DELETE SET NULL
);

CREATE INDEX IDX_Equipment_Code         ON Equipment(Code);
CREATE INDEX IDX_Equipment_CategoryId   ON Equipment(CategoryId);
CREATE INDEX IDX_Equipment_LocationId   ON Equipment(LocationId);
CREATE INDEX IDX_Equipment_Status       ON Equipment(CurrentStatus) WHERE IsActive = TRUE;
CREATE INDEX IDX_Equipment_IsActive     ON Equipment(IsActive);

-- =====================================================================
-- CHECKOUTS (Equipment going out)
-- =====================================================================
CREATE TABLE Checkouts (
    Id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    EquipmentId          UUID         NOT NULL REFERENCES Equipment(Id) ON DELETE RESTRICT,
    CheckedOutByUserId   UUID         NOT NULL REFERENCES Users(Id) ON DELETE RESTRICT,
    EventId              UUID,                                  -- nullable; FK added below
    Quantity             INTEGER      NOT NULL DEFAULT 1 CHECK (Quantity >= 1),

    CheckedOutAt         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    ExpectedReturnAt     TIMESTAMPTZ  NOT NULL,
    ActualReturnAt       TIMESTAMPTZ,

    Status               TEXT         NOT NULL DEFAULT 'Active'
                                       CHECK (Status IN ('Active','Returned','Overdue')),

    ConditionAtCheckout  CHAR(1)      CHECK (ConditionAtCheckout IN ('A','B','C','D','E')),
    ConditionAtReturn    CHAR(1)      CHECK (ConditionAtReturn IN ('A','B','C','D','E')),

    Purpose              TEXT,
    Notes                TEXT,
    DamageOnReturn       BOOLEAN      DEFAULT FALSE,

    CreatedAt            TIMESTAMPTZ  DEFAULT NOW(),
    UpdatedAt            TIMESTAMPTZ  DEFAULT NOW(),
    ReturnProcessedByUserId UUID      REFERENCES Users(Id) ON DELETE SET NULL
);

CREATE INDEX IDX_Checkouts_EquipmentId ON Checkouts(EquipmentId);
CREATE INDEX IDX_Checkouts_UserId      ON Checkouts(CheckedOutByUserId);
CREATE INDEX IDX_Checkouts_Status      ON Checkouts(Status);
CREATE INDEX IDX_Checkouts_EventId     ON Checkouts(EventId) WHERE EventId IS NOT NULL;

-- =====================================================================
-- EVENTS
-- =====================================================================
CREATE TABLE Events (
    Id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    Name                 TEXT         NOT NULL,
    EventTypeId          UUID         REFERENCES EventTypes(Id) ON DELETE SET NULL,
    LocationId           UUID         REFERENCES Locations(Id) ON DELETE SET NULL,
    CoordinatorUserId    UUID         REFERENCES Users(Id) ON DELETE SET NULL,

    StartAt              TIMESTAMPTZ  NOT NULL,
    EndAt                TIMESTAMPTZ  NOT NULL,

    Status               TEXT         NOT NULL DEFAULT 'Planned'
                                       CHECK (Status IN ('Planned','InProgress','Completed','Cancelled')),

    Description          TEXT,
    Notes                TEXT,

    CreatedAt            TIMESTAMPTZ  DEFAULT NOW(),
    UpdatedAt            TIMESTAMPTZ  DEFAULT NOW(),
    CreatedByUserId      UUID         REFERENCES Users(Id) ON DELETE SET NULL,

    CHECK (EndAt > StartAt)
);

CREATE INDEX IDX_Events_StartAt    ON Events(StartAt);
CREATE INDEX IDX_Events_Status     ON Events(Status);
CREATE INDEX IDX_Events_Coordinator ON Events(CoordinatorUserId);

-- Now add FK from Checkouts → Events
ALTER TABLE Checkouts
    ADD CONSTRAINT FK_Checkouts_Events
    FOREIGN KEY (EventId) REFERENCES Events(Id) ON DELETE SET NULL;

-- =====================================================================
-- EVENT CHECKLIST ITEMS (Equipment planned for an event)
-- =====================================================================
CREATE TABLE EventChecklistItems (
    Id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    EventId         UUID         NOT NULL REFERENCES Events(Id) ON DELETE CASCADE,
    EquipmentId     UUID         NOT NULL REFERENCES Equipment(Id) ON DELETE RESTRICT,
    Quantity        INTEGER      NOT NULL DEFAULT 1 CHECK (Quantity >= 1),
    Status          TEXT         NOT NULL DEFAULT 'Pending'
                                  CHECK (Status IN ('Pending','CheckedOut','Returned','Cancelled')),
    CheckoutId      UUID         REFERENCES Checkouts(Id) ON DELETE SET NULL,
    Notes           TEXT,
    CreatedAt       TIMESTAMPTZ  DEFAULT NOW(),
    UpdatedAt       TIMESTAMPTZ  DEFAULT NOW(),

    UNIQUE(EventId, EquipmentId)
);

CREATE INDEX IDX_EventChecklist_Event     ON EventChecklistItems(EventId);
CREATE INDEX IDX_EventChecklist_Equipment ON EventChecklistItems(EquipmentId);

-- =====================================================================
-- CONDITION LOGS (history of equipment grading)
-- =====================================================================
CREATE TABLE ConditionLogs (
    Id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    EquipmentId         UUID         NOT NULL REFERENCES Equipment(Id) ON DELETE CASCADE,
    Grade               CHAR(1)      NOT NULL CHECK (Grade IN ('A','B','C','D','E')),
    Observations        TEXT,
    PhotoUrl            TEXT,
    ReportedByUserId    UUID         NOT NULL REFERENCES Users(Id) ON DELETE RESTRICT,
    CreatedAt           TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IDX_ConditionLogs_Equipment ON ConditionLogs(EquipmentId, CreatedAt DESC);

-- =====================================================================
-- MAINTENANCE TICKETS
-- =====================================================================
CREATE TABLE MaintenanceTickets (
    Id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    TicketNumber         TEXT         NOT NULL UNIQUE,           -- e.g. 'MT-2026-0042'
    EquipmentId          UUID         NOT NULL REFERENCES Equipment(Id) ON DELETE RESTRICT,
    OpenedByUserId       UUID         NOT NULL REFERENCES Users(Id) ON DELETE RESTRICT,

    Priority             TEXT         NOT NULL DEFAULT 'Medium'
                                       CHECK (Priority IN ('Low','Medium','High','Critical')),
    Status               TEXT         NOT NULL DEFAULT 'Open'
                                       CHECK (Status IN ('Open','InRepair','Resolved','Unrepairable','ReturnedAsIs')),

    Issue                TEXT         NOT NULL,
    AssignedVendorId     UUID         REFERENCES Vendors(Id) ON DELETE SET NULL,
    EstimatedCost        NUMERIC(12,2),
    ActualCost           NUMERIC(12,2),
    Resolution           TEXT,
    Outcome              TEXT         CHECK (Outcome IN ('Resolved','Unrepairable','ReturnedAsIs')),
    GradeAfter           CHAR(1)      CHECK (GradeAfter IN ('A','B','C','D','E')),

    OpenedAt             TIMESTAMPTZ  DEFAULT NOW(),
    AssignedAt           TIMESTAMPTZ,
    ResolvedAt           TIMESTAMPTZ,

    CreatedAt            TIMESTAMPTZ  DEFAULT NOW(),
    UpdatedAt            TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IDX_MaintenanceTickets_Equipment ON MaintenanceTickets(EquipmentId);
CREATE INDEX IDX_MaintenanceTickets_Status    ON MaintenanceTickets(Status);
CREATE INDEX IDX_MaintenanceTickets_Vendor    ON MaintenanceTickets(AssignedVendorId);

-- =====================================================================
-- AUTO-UPDATE TRIGGERS for UpdatedAt
-- =====================================================================
CREATE OR REPLACE FUNCTION trigger_set_updatedat()
RETURNS TRIGGER AS $$
BEGIN
    NEW.UpdatedAt = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'roles', 'categories', 'users', 'locations', 'vendors', 'eventtypes',
        'equipment', 'checkouts', 'events', 'eventchecklistitems', 'maintenancetickets'
    ] LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updatedat BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION trigger_set_updatedat();',
            t
        );
    END LOOP;
END $$;
