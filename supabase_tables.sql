-- ============================================================
-- TABLE 1: admins
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
    email        VARCHAR(255) NOT NULL,
    name         VARCHAR(255) NOT NULL,
    control_type VARCHAR(255) NOT NULL,
    PRIMARY KEY (email)
);

-- Insert default admin
INSERT INTO admins (email, name, control_type)
VALUES ('aditya2732021@gmail.com', 'Aditya Paranjape', 'Q')
ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- TABLE 2: event_registrations
-- ============================================================
CREATE TABLE IF NOT EXISTS event_registrations (
    bookers_email            VARCHAR(255) NOT NULL,
    bookers_phone            VARCHAR(20)  NOT NULL,
    event_name               VARCHAR(255) NOT NULL,
    name                     VARCHAR(255) NOT NULL,
    age                      INT          NOT NULL DEFAULT 0,
    gender                   VARCHAR(20),
    origin                   VARCHAR(100),
    contact                  VARCHAR(50)  NOT NULL,
    attending_dates          TEXT[]       NOT NULL DEFAULT '{}',
    travelmode               VARCHAR(50),
    departure_from_home      VARCHAR(10),
    arrival_at_venue         VARCHAR(10),
    accommodation            BOOLEAN      DEFAULT FALSE,
    cot_required             BOOLEAN      DEFAULT FALSE,
    difficultyclimbingstairs BOOLEAN      DEFAULT FALSE,
    localassistance          BOOLEAN      DEFAULT FALSE,
    localassistanceperson    VARCHAR(255),
    recordings               BOOLEAN      DEFAULT FALSE,
    recordprograms           TEXT,
    specialrequests          TEXT,
    PRIMARY KEY (bookers_email, bookers_phone, name)
);


-- ============================================================
-- TABLE 3: event_dates
-- ============================================================
CREATE TABLE IF NOT EXISTS event_dates (
    email_id         VARCHAR(255) NOT NULL,
    contact          VARCHAR(255) NOT NULL,
    name             VARCHAR(255) NOT NULL,
    date             VARCHAR(255) NOT NULL,
    morning_tea      VARCHAR(255),
    morning_coffee   VARCHAR(255),
    afternoon_tea    VARCHAR(255),
    afternoon_coffee VARCHAR(255),
    breakfast        BOOLEAN DEFAULT FALSE,
    lunch            BOOLEAN DEFAULT FALSE,
    dinner           BOOLEAN DEFAULT FALSE,
    packed_lunch     BOOLEAN DEFAULT FALSE,
    packed_dinner    BOOLEAN DEFAULT FALSE,
    departuretime    VARCHAR(255)
);


-- ============================================================
-- TABLE 4: shop
-- ============================================================
CREATE TABLE IF NOT EXISTS shop (
    email_id  VARCHAR(255) NOT NULL,
    name      VARCHAR(255) NOT NULL,
    contact   VARCHAR(255) NOT NULL,
    book_name VARCHAR(255) NOT NULL,
    language  VARCHAR(255) NOT NULL,
    PRIMARY KEY (email_id, name, contact, book_name)
);


-- ============================================================
-- RLS POLICIES (Run these so the browser can access the tables)
-- ============================================================

-- Disable RLS on all tables (simplest for now; enable + add policies later for production)
ALTER TABLE admins               DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations  DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_dates          DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop                 DISABLE ROW LEVEL SECURITY;
