import { db } from "../index";

async function main() {
  console.log("Creating modifier_groups, modifier_options, and menu_item_modifier_groups tables...");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS modifier_groups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      selection_type TEXT NOT NULL DEFAULT 'MULTIPLE',
      is_required BOOLEAN NOT NULL DEFAULT false,
      min_selections INTEGER NOT NULL DEFAULT 0,
      max_selections INTEGER,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS modifier_options (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      modifier_group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      price_delta INTEGER NOT NULL DEFAULT 0,
      is_available BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS menu_item_modifier_groups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
      modifier_group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS modifier_groups_cafe_id_idx ON modifier_groups(cafe_id);
    CREATE INDEX IF NOT EXISTS modifier_options_group_id_idx ON modifier_options(modifier_group_id);
    CREATE INDEX IF NOT EXISTS menu_item_mod_item_idx ON menu_item_modifier_groups(menu_item_id);
    CREATE INDEX IF NOT EXISTS menu_item_mod_group_idx ON menu_item_modifier_groups(modifier_group_id);
  `);

  console.log("Modifier tables successfully created.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
