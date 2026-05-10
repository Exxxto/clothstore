import "dotenv/config";
import pg from "pg";

const testRunId = process.argv[2] || process.env.TEST_RUN_ID;

if (!testRunId) {
  console.error("Usage: npm run cleanup:e2e -- <test_run_id>");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  await client.query("BEGIN");

  const { rows: orderRows } = await client.query(
    `SELECT id
     FROM orders
     WHERE is_test = TRUE
       AND test_run_id = $1`,
    [testRunId],
  );
  const orderIds = orderRows.map((row) => row.id);

  if (orderIds.length > 0) {
    await client.query("DELETE FROM promo_code_redemptions WHERE order_id = ANY($1::int[])", [orderIds]);
    await client.query("DELETE FROM orders WHERE id = ANY($1::int[])", [orderIds]);
  }

  const { rowCount: deletedAddresses } = await client.query(
    `DELETE FROM customer_addresses
     WHERE is_test = TRUE
       AND test_run_id = $1`,
    [testRunId],
  );

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        test_run_id: testRunId,
        deleted_orders: orderIds.length,
        deleted_addresses: deletedAddresses,
      },
      null,
      2,
    ),
  );
} catch (error) {
  await client.query("ROLLBACK");
  console.error(error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
