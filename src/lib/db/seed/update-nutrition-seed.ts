import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);

async function main() {
  console.log("Updating sample dishes with nutrition data and multi-image galleries...");

  const [cafe] = await sql`SELECT id FROM cafes WHERE slug = 'the-roasted-bean' LIMIT 1`;
  if (!cafe) {
    console.log("Cafe not found.");
    await sql.end();
    return;
  }

  // Update Almond Croissant with nutrition & 2 images
  await sql`
    UPDATE menu_items
    SET
      calories = 380,
      protein_grams = 9,
      fat_grams = 22,
      carbs_grams = 36,
      image_key = ${JSON.stringify([
        "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1623334044303-241021148842?auto=format&fit=crop&w=800&q=80"
      ])}
    WHERE cafe_id = ${cafe.id} AND slug = 'almond-croissant'
  `;

  // Update Ethiopia V60 with nutrition & 2 images
  await sql`
    UPDATE menu_items
    SET
      calories = 5,
      protein_grams = 1,
      fat_grams = 0,
      carbs_grams = 1,
      image_key = ${JSON.stringify([
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"
      ])}
    WHERE cafe_id = ${cafe.id} AND slug = 'ethiopia-yirgacheffe'
  `;

  // Update Chicken Brioche if exists
  await sql`
    UPDATE menu_items
    SET
      calories = 580,
      protein_grams = 42,
      fat_grams = 26,
      carbs_grams = 45
    WHERE cafe_id = ${cafe.id} AND slug = 'smoked-chicken-brioche'
  `;

  console.log("Nutrition and multi-image data updated successfully!");
  await sql.end();
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
