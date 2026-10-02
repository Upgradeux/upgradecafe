import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);

async function main() {
  console.log("Polishing tables for The Roasted Bean...");

  const [cafe] = await sql`SELECT id FROM cafes WHERE slug = 'the-roasted-bean' LIMIT 1`;
  if (!cafe) {
    console.log("Cafe not found.");
    await sql.end();
    return;
  }

  // Update Community Table to have capacity = 8
  await sql`
    UPDATE tables
    SET capacity = 8
    WHERE cafe_id = ${cafe.id} AND table_number = 'Community Table'
  `;

  // Fetch all tables
  const tablesList = await sql`
    SELECT t.id, t.table_number, t.capacity, t.status, f.name as floor_name
    FROM tables t
    LEFT JOIN floors f ON t.floor_id = f.id
    WHERE t.cafe_id = ${cafe.id}
    ORDER BY t.table_number
  `;

  console.log("Current Tables for The Roasted Bean:");
  console.table(tablesList);

  const totalCap = tablesList.reduce((acc, t) => acc + (t.capacity || 0), 0);
  const availCap = tablesList
    .filter((t) => t.status === "AVAILABLE")
    .reduce((acc, t) => acc + (t.capacity || 0), 0);
  const availCount = tablesList.filter((t) => t.status === "AVAILABLE").length;

  console.log(`\nSummary: ${availCount} of ${tablesList.length} tables available (${availCap} of ${totalCap} seats vacant)`);

  await sql.end();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
