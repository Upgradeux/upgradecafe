import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);

async function main() {
  console.log("Updating menu items for The Roasted Bean with Non-Veg, Egg, and Vegan options...");

  // Find The Roasted Bean cafe
  const [cafe] = await sql`SELECT id FROM cafes WHERE slug = 'the-roasted-bean' LIMIT 1`;
  if (!cafe) {
    console.log("The Roasted Bean cafe not found.");
    await sql.end();
    return;
  }

  // Find Bakery category
  const [bakeryCat] = await sql`SELECT id FROM categories WHERE cafe_id = ${cafe.id} AND slug = 'bakery-food' LIMIT 1`;
  const [coldCat] = await sql`SELECT id FROM categories WHERE cafe_id = ${cafe.id} AND slug = 'cold-brews' LIMIT 1`;
  const [espressoCat] = await sql`SELECT id FROM categories WHERE cafe_id = ${cafe.id} AND slug = 'espresso-classics' LIMIT 1`;

  // Update existing items
  await sql`
    UPDATE menu_items 
    SET food_type = 'VEG', temperature = 'HOT', is_bestseller = false, is_spicy = false
    WHERE cafe_id = ${cafe.id} AND slug = 'cortado'
  `;

  await sql`
    UPDATE menu_items 
    SET food_type = 'VEG', temperature = 'HOT', is_bestseller = false, is_spicy = false
    WHERE cafe_id = ${cafe.id} AND slug = 'flat-white'
  `;

  await sql`
    UPDATE menu_items 
    SET food_type = 'VEGAN', temperature = 'HOT', is_bestseller = false, is_spicy = false
    WHERE cafe_id = ${cafe.id} AND slug = 'ethiopia-yirgacheffe'
  `;

  await sql`
    UPDATE menu_items 
    SET food_type = 'VEGAN', temperature = 'COLD', is_bestseller = true, is_spicy = false
    WHERE cafe_id = ${cafe.id} AND slug = 'nitro-cold-brew'
  `;

  await sql`
    UPDATE menu_items 
    SET food_type = 'VEGAN', temperature = 'COLD', is_bestseller = false, is_spicy = false
    WHERE cafe_id = ${cafe.id} AND slug = 'espresso-tonic'
  `;

  await sql`
    UPDATE menu_items 
    SET food_type = 'EGG', is_vegetarian = false, is_bestseller = false, allergens = 'Contains Wheat, Eggs, Tree Nuts'
    WHERE cafe_id = ${cafe.id} AND slug = 'almond-croissant'
  `;

  await sql`
    UPDATE menu_items 
    SET food_type = 'VEGAN', is_bestseller = true, allergens = 'Contains Gluten, Sesame'
    WHERE cafe_id = ${cafe.id} AND slug = 'avocado-toast'
  `;

  if (bakeryCat) {
    // Add Non-Veg Items
    await sql`
      INSERT INTO menu_items (
        cafe_id, category_id, name, slug, description, price, is_available, is_vegetarian,
        food_type, is_bestseller, is_spicy, temperature, allergens, calories, preparation_time_minutes, sort_order
      ) VALUES 
      (
        ${cafe.id},
        ${bakeryCat.id},
        'Smoked Chicken & Pesto Panini',
        'smoked-chicken-pesto-panini',
        'Tender house-smoked chicken breast, sweet basil pesto, bocconcini mozzarella, and sun-dried tomatoes on pressed sourdough',
        340,
        true,
        false,
        'NON_VEG',
        true,
        false,
        'HOT',
        'Contains Milk, Wheat (Gluten), Pine Nuts',
        460,
        12,
        2
      )
      ON CONFLICT DO NOTHING
    `;

    await sql`
      INSERT INTO menu_items (
        cafe_id, category_id, name, slug, description, price, is_available, is_vegetarian,
        food_type, is_bestseller, is_spicy, temperature, allergens, calories, preparation_time_minutes, sort_order
      ) VALUES 
      (
        ${cafe.id},
        ${bakeryCat.id},
        'Peri-Peri Grilled Chicken Wrap',
        'peri-peri-chicken-wrap',
        'Flame-grilled chicken strips tossed in spicy African bird eye chili glaze, crisp lettuce, and garlic aioli in whole wheat tortilla',
        310,
        true,
        false,
        'NON_VEG',
        false,
        true,
        'HOT',
        'Contains Wheat (Gluten), Eggs, Garlic',
        380,
        10,
        3
      )
      ON CONFLICT DO NOTHING
    `;

    await sql`
      INSERT INTO menu_items (
        cafe_id, category_id, name, slug, description, price, is_available, is_vegetarian,
        food_type, is_bestseller, is_spicy, temperature, allergens, calories, preparation_time_minutes, sort_order
      ) VALUES 
      (
        ${cafe.id},
        ${bakeryCat.id},
        'Truffle Scrambled Egg Croissant',
        'truffle-scrambled-egg-croissant',
        'Fluffy French-style butter scrambled eggs drizzled with white truffle oil and chives inside a toasted golden croissant',
        280,
        true,
        false,
        'EGG',
        true,
        false,
        'HOT',
        'Contains Eggs, Milk, Wheat (Gluten)',
        390,
        8,
        4
      )
      ON CONFLICT DO NOTHING
    `;
  }

  console.log("Successfully seeded Non-Veg, Egg, and Vegan items!");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
