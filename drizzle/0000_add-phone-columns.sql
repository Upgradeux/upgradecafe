CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'USER' NOT NULL,
	"phone_number" text,
	"phone_number_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cafes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"contact_email" text,
	"phone" text,
	"address" text,
	"currency" text DEFAULT 'INR' NOT NULL,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"logo_key" text,
	"cover_key" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"manual_status_override" text,
	"suspension_reason" text,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cafe_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"cafe_id" uuid NOT NULL,
	"role" text DEFAULT 'STAFF' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"monthly_price" integer DEFAULT 0 NOT NULL,
	"yearly_price" integer DEFAULT 0 NOT NULL,
	"lifetime_price" integer DEFAULT 0 NOT NULL,
	"max_branches" integer DEFAULT 1 NOT NULL,
	"max_menu_items" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"billing_cycle" text DEFAULT 'MONTHLY' NOT NULL,
	"starts_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"grace_period_days" integer DEFAULT 7 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"subscription_id" uuid,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"payment_method" text NOT NULL,
	"payment_date" timestamp NOT NULL,
	"reference_number" text,
	"notes" text,
	"recorded_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"cafe_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_item_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"is_vegetarian" boolean DEFAULT true NOT NULL,
	"food_type" text DEFAULT 'VEG' NOT NULL,
	"is_bestseller" boolean DEFAULT false NOT NULL,
	"is_spicy" boolean DEFAULT false NOT NULL,
	"temperature" text DEFAULT 'NOT_APPLICABLE' NOT NULL,
	"allergens" text,
	"calories" integer,
	"protein_grams" integer,
	"fat_grams" integer,
	"carbs_grams" integer,
	"image_key" text,
	"preparation_time_minutes" integer DEFAULT 10,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "floors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"floor_id" uuid,
	"table_number" text NOT NULL,
	"capacity" integer DEFAULT 2 NOT NULL,
	"status" text DEFAULT 'AVAILABLE' NOT NULL,
	"current_guests" integer,
	"occupied_since_minutes" integer,
	"current_bill_amount" integer,
	"reserved_for_time" text,
	"notes" text,
	"qr_identifier" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cafe_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"theme_preset" text DEFAULT 'roast' NOT NULL,
	"digital_menu_theme" text DEFAULT 'roast' NOT NULL,
	"layout_preset" text DEFAULT 'modern_app' NOT NULL,
	"primary_color" text,
	"secondary_color" text,
	"font_family" text DEFAULT 'Plus Jakarta Sans' NOT NULL,
	"border_radius" text DEFAULT '8px' NOT NULL,
	"enable_qr_ordering" boolean DEFAULT true NOT NULL,
	"enable_dine_in" boolean DEFAULT true NOT NULL,
	"enable_takeaway" boolean DEFAULT true NOT NULL,
	"allow_order_notes" boolean DEFAULT true NOT NULL,
	"enable_reviews" boolean DEFAULT true NOT NULL,
	"enable_offers" boolean DEFAULT true NOT NULL,
	"google_review_url" text,
	"home_sections" jsonb,
	"upi_id" text,
	"upi_merchant_name" text,
	"upi_qr_url" text,
	"upi_qr_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"table_id" uuid,
	"customer_id" text,
	"session_token_hash" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"menu_item_id" uuid,
	"item_name" text NOT NULL,
	"unit_price" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"item_total" integer NOT NULL,
	"variant_name" text,
	"special_instructions" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"guest_session_id" uuid,
	"customer_id" text,
	"order_number" text NOT NULL,
	"order_type" text DEFAULT 'DINE_IN' NOT NULL,
	"table_id" uuid,
	"table_name_snapshot" text,
	"customer_name" text,
	"customer_phone" text,
	"status" text DEFAULT 'NEW' NOT NULL,
	"payment_status" text DEFAULT 'UNPAID' NOT NULL,
	"payment_method" text,
	"subtotal" integer NOT NULL,
	"tax" integer DEFAULT 0 NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"notes" text,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"preparing_at" timestamp,
	"ready_at" timestamp,
	"served_at" timestamp,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"payment_verified_at" timestamp,
	"payment_rejected_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"table_id" uuid,
	"table_name_snapshot" text NOT NULL,
	"request_type" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"discount_type" text DEFAULT 'PERCENTAGE' NOT NULL,
	"discount_value" integer NOT NULL,
	"max_discount_amount" integer,
	"min_order_amount" integer DEFAULT 0,
	"reward_item_id" uuid,
	"reward_item_name" text,
	"application_method" text DEFAULT 'COUPON_CODE' NOT NULL,
	"applies_to" text DEFAULT 'ALL' NOT NULL,
	"target_category_ids" text,
	"target_item_ids" text,
	"customer_eligibility" text DEFAULT 'ALL' NOT NULL,
	"usage_limit_total" integer,
	"usage_limit_per_customer" integer DEFAULT 1,
	"time_start" text,
	"time_end" text,
	"days_of_week" text,
	"available_channels" text DEFAULT 'DIGITAL_MENU,POS' NOT NULL,
	"applicable_order_type" text DEFAULT 'BOTH' NOT NULL,
	"cannot_combine" boolean DEFAULT true NOT NULL,
	"free_item_unlock_type" text DEFAULT 'SPEND' NOT NULL,
	"free_item_qualifying_category_id" uuid,
	"free_item_qualifying_item_id" uuid,
	"badge_text" text DEFAULT 'Limited Time',
	"image_url" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"guests" integer DEFAULT 2 NOT NULL,
	"preference_type" text DEFAULT 'ANY' NOT NULL,
	"preferred_table_id" uuid,
	"preferred_table_name" text,
	"status" text DEFAULT 'WAITING' NOT NULL,
	"held_table_id" uuid,
	"hold_expires_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_item_modifier_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"modifier_group_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modifier_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"selection_type" text DEFAULT 'MULTIPLE' NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"min_selections" integer DEFAULT 0 NOT NULL,
	"max_selections" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modifier_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"modifier_group_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price_delta" integer DEFAULT 0 NOT NULL,
	"dietary_type" text DEFAULT 'VEG',
	"is_available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cafe_memberships" ADD CONSTRAINT "cafe_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cafe_memberships" ADD CONSTRAINT "cafe_memberships_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_variants" ADD CONSTRAINT "menu_item_variants_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floors" ADD CONSTRAINT "floors_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tables" ADD CONSTRAINT "tables_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tables" ADD CONSTRAINT "tables_floor_id_floors_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cafe_settings" ADD CONSTRAINT "cafe_settings_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_sessions" ADD CONSTRAINT "guest_sessions_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_sessions" ADD CONSTRAINT "guest_sessions_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_sessions" ADD CONSTRAINT "guest_sessions_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_guest_session_id_guest_sessions_id_fk" FOREIGN KEY ("guest_session_id") REFERENCES "public"."guest_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_preferred_table_id_tables_id_fk" FOREIGN KEY ("preferred_table_id") REFERENCES "public"."tables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_held_table_id_tables_id_fk" FOREIGN KEY ("held_table_id") REFERENCES "public"."tables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_modifier_groups" ADD CONSTRAINT "menu_item_modifier_groups_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_modifier_groups" ADD CONSTRAINT "menu_item_modifier_groups_modifier_group_id_modifier_groups_id_fk" FOREIGN KEY ("modifier_group_id") REFERENCES "public"."modifier_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_options" ADD CONSTRAINT "modifier_options_modifier_group_id_modifier_groups_id_fk" FOREIGN KEY ("modifier_group_id") REFERENCES "public"."modifier_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cafes_slug_idx" ON "cafes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "cafes_status_idx" ON "cafes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cafes_created_at_idx" ON "cafes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "memberships_user_id_idx" ON "cafe_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "memberships_cafe_id_idx" ON "cafe_memberships" USING btree ("cafe_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_user_cafe_unique_idx" ON "cafe_memberships" USING btree ("user_id","cafe_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plans_slug_idx" ON "plans" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "subscriptions_cafe_id_idx" ON "subscriptions" USING btree ("cafe_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_expires_at_idx" ON "subscriptions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "payments_cafe_id_idx" ON "payments" USING btree ("cafe_id");--> statement-breakpoint
CREATE INDEX "payments_payment_date_idx" ON "payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_cafe_id_idx" ON "audit_logs" USING btree ("cafe_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "categories_cafe_id_idx" ON "categories" USING btree ("cafe_id");--> statement-breakpoint
CREATE INDEX "categories_sort_order_idx" ON "categories" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "menu_item_variants_item_id_idx" ON "menu_item_variants" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "menu_items_cafe_id_idx" ON "menu_items" USING btree ("cafe_id");--> statement-breakpoint
CREATE INDEX "menu_items_category_id_idx" ON "menu_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "menu_items_is_available_idx" ON "menu_items" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "menu_items_sort_order_idx" ON "menu_items" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "floors_cafe_id_idx" ON "floors" USING btree ("cafe_id");--> statement-breakpoint
CREATE INDEX "tables_cafe_id_idx" ON "tables" USING btree ("cafe_id");--> statement-breakpoint
CREATE INDEX "tables_floor_id_idx" ON "tables" USING btree ("floor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tables_qr_identifier_idx" ON "tables" USING btree ("qr_identifier");--> statement-breakpoint
CREATE INDEX "tables_status_idx" ON "tables" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "cafe_settings_cafe_id_unique_idx" ON "cafe_settings" USING btree ("cafe_id");--> statement-breakpoint
CREATE INDEX "guest_sessions_cafe_id_idx" ON "guest_sessions" USING btree ("cafe_id");--> statement-breakpoint
CREATE INDEX "guest_sessions_table_id_idx" ON "guest_sessions" USING btree ("table_id");--> statement-breakpoint
CREATE INDEX "guest_sessions_customer_id_idx" ON "guest_sessions" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "guest_sessions_token_hash_idx" ON "guest_sessions" USING btree ("session_token_hash");--> statement-breakpoint
CREATE INDEX "guest_sessions_status_idx" ON "guest_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "guest_sessions_expires_at_idx" ON "guest_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_menu_item_id_idx" ON "order_items" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "orders_cafe_id_idx" ON "orders" USING btree ("cafe_id");--> statement-breakpoint
CREATE INDEX "orders_guest_session_id_idx" ON "orders" USING btree ("guest_session_id");--> statement-breakpoint
CREATE INDEX "orders_customer_id_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_table_id_idx" ON "orders" USING btree ("table_id");--> statement-breakpoint
CREATE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "service_requests_cafe_id_idx" ON "service_requests" USING btree ("cafe_id");--> statement-breakpoint
CREATE INDEX "service_requests_status_idx" ON "service_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "service_requests_created_at_idx" ON "service_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "waitlist_cafe_id_idx" ON "waitlist" USING btree ("cafe_id");--> statement-breakpoint
CREATE INDEX "waitlist_status_idx" ON "waitlist" USING btree ("status");--> statement-breakpoint
CREATE INDEX "waitlist_created_at_idx" ON "waitlist" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "waitlist_preferred_table_idx" ON "waitlist" USING btree ("preferred_table_id");--> statement-breakpoint
CREATE INDEX "menu_item_mod_item_idx" ON "menu_item_modifier_groups" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "menu_item_mod_group_idx" ON "menu_item_modifier_groups" USING btree ("modifier_group_id");--> statement-breakpoint
CREATE INDEX "modifier_groups_cafe_id_idx" ON "modifier_groups" USING btree ("cafe_id");--> statement-breakpoint
CREATE INDEX "modifier_groups_sort_order_idx" ON "modifier_groups" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "modifier_options_group_id_idx" ON "modifier_options" USING btree ("modifier_group_id");