-- Phase 5 — Public Vertical Pages: Clinic / Consultório + Restaurant / Restaurante
-- Migration: add_public_vertical_pages_models
-- Generated manually (DATABASE_URL points to remote Neon instance; migrate dev not executed)
-- Safe to apply as-is: ADDITIVE ONLY — no drops, no renames, no column removals.

-- ─── CLINIC / CONSULTÓRIO ─────────────────────────────────────────────────────

CREATE TABLE "clinic_profiles" (
    "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId"      TEXT NOT NULL,
    "slug"          TEXT NOT NULL,
    "displayName"   TEXT NOT NULL,
    "description"   TEXT,
    "whatsappPhone" TEXT,
    "address"       TEXT,
    "city"          TEXT,
    "state"         TEXT,
    "isPublished"   BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clinic_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "clinic_profiles_slug_key"     ON "clinic_profiles"("slug");
CREATE UNIQUE INDEX "clinic_profiles_tenantId_key" ON "clinic_profiles"("tenantId");
CREATE INDEX        "clinic_profiles_isPublished"  ON "clinic_profiles"("isPublished");

ALTER TABLE "clinic_profiles"
    ADD CONSTRAINT "clinic_profiles_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "clinic_services" (
    "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId"         TEXT NOT NULL,
    "clinicProfileId"  TEXT NOT NULL,
    "name"             TEXT NOT NULL,
    "description"      TEXT,
    "durationMinutes"  INTEGER,
    "priceDescription" TEXT,
    "isActive"         BOOLEAN NOT NULL DEFAULT TRUE,
    "sortOrder"        INTEGER NOT NULL DEFAULT 0,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clinic_services_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "clinic_services_tenantId"        ON "clinic_services"("tenantId");
CREATE INDEX "clinic_services_clinicProfileId" ON "clinic_services"("clinicProfileId");

ALTER TABLE "clinic_services"
    ADD CONSTRAINT "clinic_services_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clinic_services"
    ADD CONSTRAINT "clinic_services_clinicProfileId_fkey"
    FOREIGN KEY ("clinicProfileId") REFERENCES "clinic_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "clinic_professionals" (
    "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId"        TEXT NOT NULL,
    "clinicProfileId" TEXT NOT NULL,
    "name"            TEXT NOT NULL,
    "role"            TEXT,
    "bio"             TEXT,
    "isActive"        BOOLEAN NOT NULL DEFAULT TRUE,
    "sortOrder"       INTEGER NOT NULL DEFAULT 0,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clinic_professionals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "clinic_professionals_tenantId"        ON "clinic_professionals"("tenantId");
CREATE INDEX "clinic_professionals_clinicProfileId" ON "clinic_professionals"("clinicProfileId");

ALTER TABLE "clinic_professionals"
    ADD CONSTRAINT "clinic_professionals_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clinic_professionals"
    ADD CONSTRAINT "clinic_professionals_clinicProfileId_fkey"
    FOREIGN KEY ("clinicProfileId") REFERENCES "clinic_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "clinic_availability" (
    "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId"        TEXT NOT NULL,
    "clinicProfileId" TEXT NOT NULL,
    "professionalId"  TEXT,
    "dayOfWeek"       INTEGER NOT NULL,
    "startTime"       TEXT NOT NULL,
    "endTime"         TEXT NOT NULL,
    "isActive"        BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clinic_availability_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "clinic_availability_tenantId"        ON "clinic_availability"("tenantId");
CREATE INDEX "clinic_availability_clinicProfileId" ON "clinic_availability"("clinicProfileId");

ALTER TABLE "clinic_availability"
    ADD CONSTRAINT "clinic_availability_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clinic_availability"
    ADD CONSTRAINT "clinic_availability_clinicProfileId_fkey"
    FOREIGN KEY ("clinicProfileId") REFERENCES "clinic_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clinic_availability"
    ADD CONSTRAINT "clinic_availability_professionalId_fkey"
    FOREIGN KEY ("professionalId") REFERENCES "clinic_professionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "appointment_requests" (
    "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId"        TEXT NOT NULL,
    "clinicProfileId" TEXT NOT NULL,
    "serviceId"       TEXT,
    "professionalId"  TEXT,
    "customerName"    TEXT NOT NULL,
    "customerPhone"   TEXT NOT NULL,
    "customerEmail"   TEXT,
    "preferredDate"   TEXT,
    "preferredTime"   TEXT,
    "notes"           TEXT,
    "status"          TEXT NOT NULL DEFAULT 'NEW',
    "source"          TEXT NOT NULL DEFAULT 'public_page',
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "appointment_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointment_requests_tenantId"        ON "appointment_requests"("tenantId");
CREATE INDEX "appointment_requests_clinicProfileId" ON "appointment_requests"("clinicProfileId");
CREATE INDEX "appointment_requests_tenantId_status" ON "appointment_requests"("tenantId", "status");

ALTER TABLE "appointment_requests"
    ADD CONSTRAINT "appointment_requests_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointment_requests"
    ADD CONSTRAINT "appointment_requests_clinicProfileId_fkey"
    FOREIGN KEY ("clinicProfileId") REFERENCES "clinic_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointment_requests"
    ADD CONSTRAINT "appointment_requests_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "clinic_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "appointment_requests"
    ADD CONSTRAINT "appointment_requests_professionalId_fkey"
    FOREIGN KEY ("professionalId") REFERENCES "clinic_professionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "public_booking_page_configs" (
    "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId"         TEXT NOT NULL,
    "clinicProfileId"  TEXT NOT NULL,
    "heroTitle"        TEXT,
    "heroSubtitle"     TEXT,
    "primaryCtaLabel"  TEXT,
    "showPrices"       BOOLEAN NOT NULL DEFAULT TRUE,
    "showProfessionals" BOOLEAN NOT NULL DEFAULT TRUE,
    "showAddress"      BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,
    CONSTRAINT "public_booking_page_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "public_booking_page_configs_clinicProfileId_key" ON "public_booking_page_configs"("clinicProfileId");
CREATE INDEX        "public_booking_page_configs_tenantId"            ON "public_booking_page_configs"("tenantId");

ALTER TABLE "public_booking_page_configs"
    ADD CONSTRAINT "public_booking_page_configs_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public_booking_page_configs"
    ADD CONSTRAINT "public_booking_page_configs_clinicProfileId_fkey"
    FOREIGN KEY ("clinicProfileId") REFERENCES "clinic_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── RESTAURANT / RESTAURANTE ─────────────────────────────────────────────────

CREATE TABLE "restaurant_profiles" (
    "id"                     TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId"               TEXT NOT NULL,
    "slug"                   TEXT NOT NULL,
    "displayName"            TEXT NOT NULL,
    "description"            TEXT,
    "whatsappPhone"          TEXT,
    "address"                TEXT,
    "city"                   TEXT,
    "state"                  TEXT,
    "acceptsDelivery"        BOOLEAN NOT NULL DEFAULT TRUE,
    "acceptsPickup"          BOOLEAN NOT NULL DEFAULT TRUE,
    "deliveryFeeDescription" TEXT,
    "minimumOrderValue"      DOUBLE PRECISION,
    "isPublished"            BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"              TIMESTAMP(3) NOT NULL,
    CONSTRAINT "restaurant_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "restaurant_profiles_slug_key"     ON "restaurant_profiles"("slug");
CREATE UNIQUE INDEX "restaurant_profiles_tenantId_key" ON "restaurant_profiles"("tenantId");
CREATE INDEX        "restaurant_profiles_isPublished"  ON "restaurant_profiles"("isPublished");

ALTER TABLE "restaurant_profiles"
    ADD CONSTRAINT "restaurant_profiles_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "public_menu_page_configs" (
    "id"                  TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId"            TEXT NOT NULL,
    "restaurantProfileId" TEXT NOT NULL,
    "heroTitle"           TEXT,
    "heroSubtitle"        TEXT,
    "primaryCtaLabel"     TEXT,
    "showDeliveryInfo"    BOOLEAN NOT NULL DEFAULT TRUE,
    "showPickupInfo"      BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,
    CONSTRAINT "public_menu_page_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "public_menu_page_configs_restaurantProfileId_key" ON "public_menu_page_configs"("restaurantProfileId");
CREATE INDEX        "public_menu_page_configs_tenantId"                ON "public_menu_page_configs"("tenantId");

ALTER TABLE "public_menu_page_configs"
    ADD CONSTRAINT "public_menu_page_configs_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public_menu_page_configs"
    ADD CONSTRAINT "public_menu_page_configs_restaurantProfileId_fkey"
    FOREIGN KEY ("restaurantProfileId") REFERENCES "restaurant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "food_categories" (
    "id"                  TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId"            TEXT NOT NULL,
    "restaurantProfileId" TEXT NOT NULL,
    "name"                TEXT NOT NULL,
    "description"         TEXT,
    "isActive"            BOOLEAN NOT NULL DEFAULT TRUE,
    "sortOrder"           INTEGER NOT NULL DEFAULT 0,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_categories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "food_categories_tenantId"            ON "food_categories"("tenantId");
CREATE INDEX "food_categories_restaurantProfileId" ON "food_categories"("restaurantProfileId");

ALTER TABLE "food_categories"
    ADD CONSTRAINT "food_categories_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "food_categories"
    ADD CONSTRAINT "food_categories_restaurantProfileId_fkey"
    FOREIGN KEY ("restaurantProfileId") REFERENCES "restaurant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "food_products" (
    "id"                  TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId"            TEXT NOT NULL,
    "restaurantProfileId" TEXT NOT NULL,
    "categoryId"          TEXT NOT NULL,
    "name"                TEXT NOT NULL,
    "description"         TEXT,
    "price"               DOUBLE PRECISION NOT NULL,
    "imageUrl"            TEXT,
    "isActive"            BOOLEAN NOT NULL DEFAULT TRUE,
    "isAvailable"         BOOLEAN NOT NULL DEFAULT TRUE,
    "sortOrder"           INTEGER NOT NULL DEFAULT 0,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_products_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "food_products_tenantId"            ON "food_products"("tenantId");
CREATE INDEX "food_products_restaurantProfileId" ON "food_products"("restaurantProfileId");
CREATE INDEX "food_products_categoryId"          ON "food_products"("categoryId");

ALTER TABLE "food_products"
    ADD CONSTRAINT "food_products_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "food_products"
    ADD CONSTRAINT "food_products_restaurantProfileId_fkey"
    FOREIGN KEY ("restaurantProfileId") REFERENCES "restaurant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "food_products"
    ADD CONSTRAINT "food_products_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "food_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "food_addon_groups" (
    "id"                  TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId"            TEXT NOT NULL,
    "restaurantProfileId" TEXT NOT NULL,
    "productId"           TEXT,
    "name"                TEXT NOT NULL,
    "minSelect"           INTEGER NOT NULL DEFAULT 0,
    "maxSelect"           INTEGER NOT NULL DEFAULT 1,
    "isRequired"          BOOLEAN NOT NULL DEFAULT FALSE,
    "isActive"            BOOLEAN NOT NULL DEFAULT TRUE,
    "sortOrder"           INTEGER NOT NULL DEFAULT 0,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_addon_groups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "food_addon_groups_tenantId"            ON "food_addon_groups"("tenantId");
CREATE INDEX "food_addon_groups_restaurantProfileId" ON "food_addon_groups"("restaurantProfileId");
CREATE INDEX "food_addon_groups_productId"           ON "food_addon_groups"("productId");

ALTER TABLE "food_addon_groups"
    ADD CONSTRAINT "food_addon_groups_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "food_addon_groups"
    ADD CONSTRAINT "food_addon_groups_restaurantProfileId_fkey"
    FOREIGN KEY ("restaurantProfileId") REFERENCES "restaurant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "food_addon_groups"
    ADD CONSTRAINT "food_addon_groups_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "food_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "food_addon_options" (
    "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId"     TEXT NOT NULL,
    "addonGroupId" TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "priceDelta"   DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive"     BOOLEAN NOT NULL DEFAULT TRUE,
    "sortOrder"    INTEGER NOT NULL DEFAULT 0,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_addon_options_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "food_addon_options_tenantId"     ON "food_addon_options"("tenantId");
CREATE INDEX "food_addon_options_addonGroupId" ON "food_addon_options"("addonGroupId");

ALTER TABLE "food_addon_options"
    ADD CONSTRAINT "food_addon_options_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "food_addon_options"
    ADD CONSTRAINT "food_addon_options_addonGroupId_fkey"
    FOREIGN KEY ("addonGroupId") REFERENCES "food_addon_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "food_orders" (
    "id"                  TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId"            TEXT NOT NULL,
    "restaurantProfileId" TEXT NOT NULL,
    "customerName"        TEXT NOT NULL,
    "customerPhone"       TEXT NOT NULL,
    "customerAddress"     TEXT,
    "customerNotes"       TEXT,
    "fulfillmentType"     TEXT NOT NULL,
    "paymentMethodText"   TEXT,
    "subtotal"            DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryFee"         DOUBLE PRECISION,
    "total"               DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status"              TEXT NOT NULL DEFAULT 'NEW',
    "source"              TEXT NOT NULL DEFAULT 'public_page',
    "whatsappMessage"     TEXT,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_orders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "food_orders_tenantId"              ON "food_orders"("tenantId");
CREATE INDEX "food_orders_restaurantProfileId"   ON "food_orders"("restaurantProfileId");
CREATE INDEX "food_orders_tenantId_status"       ON "food_orders"("tenantId", "status");

ALTER TABLE "food_orders"
    ADD CONSTRAINT "food_orders_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "food_orders"
    ADD CONSTRAINT "food_orders_restaurantProfileId_fkey"
    FOREIGN KEY ("restaurantProfileId") REFERENCES "restaurant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "food_order_items" (
    "id"                  TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId"            TEXT NOT NULL,
    "orderId"             TEXT NOT NULL,
    "productId"           TEXT,
    "productNameSnapshot" TEXT NOT NULL,
    "quantity"            INTEGER NOT NULL DEFAULT 1,
    "unitPrice"           DOUBLE PRECISION NOT NULL,
    "notes"               TEXT,
    "total"               DOUBLE PRECISION NOT NULL,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_order_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "food_order_items_tenantId"   ON "food_order_items"("tenantId");
CREATE INDEX "food_order_items_orderId"    ON "food_order_items"("orderId");
CREATE INDEX "food_order_items_productId"  ON "food_order_items"("productId");

ALTER TABLE "food_order_items"
    ADD CONSTRAINT "food_order_items_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "food_order_items"
    ADD CONSTRAINT "food_order_items_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "food_order_items"
    ADD CONSTRAINT "food_order_items_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "food_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "food_order_item_addons" (
    "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId"          TEXT NOT NULL,
    "orderItemId"       TEXT NOT NULL,
    "addonOptionId"     TEXT,
    "addonNameSnapshot" TEXT NOT NULL,
    "priceDelta"        DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity"          INTEGER NOT NULL DEFAULT 1,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_order_item_addons_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "food_order_item_addons_tenantId"     ON "food_order_item_addons"("tenantId");
CREATE INDEX "food_order_item_addons_orderItemId"  ON "food_order_item_addons"("orderItemId");

ALTER TABLE "food_order_item_addons"
    ADD CONSTRAINT "food_order_item_addons_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "food_order_item_addons"
    ADD CONSTRAINT "food_order_item_addons_orderItemId_fkey"
    FOREIGN KEY ("orderItemId") REFERENCES "food_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "food_order_item_addons"
    ADD CONSTRAINT "food_order_item_addons_addonOptionId_fkey"
    FOREIGN KEY ("addonOptionId") REFERENCES "food_addon_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
