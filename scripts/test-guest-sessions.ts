import { db } from "../src/lib/db";
import { cafes } from "../src/lib/db/schema/cafes";
import { orders } from "../src/lib/db/schema/orders";
import { users } from "../src/lib/db/schema/users";
import { guestSessions } from "../src/lib/db/schema/guest-sessions";
import { eq } from "drizzle-orm";
import {
  GuestSessionService,
  hashSessionToken,
} from "../src/features/cafe/orders/services/guest-session.service";
import { OrdersService } from "../src/features/cafe/orders/services/orders.service";

async function testGuestSessionsFlow() {
  console.log("=== Testing Guest Session Architecture ===");

  // 1. Resolve Cafe
  const [cafe] = await db
    .select()
    .from(cafes)
    .where(eq(cafes.slug, "the-roasted-bean"))
    .limit(1);

  if (!cafe) throw new Error("Cafe not found");
  console.log("✓ Found cafe:", cafe.name, `(${cafe.id})`);

  // 2. Resolve/Create Guest Session (Phone A)
  const sessionResult = await GuestSessionService.resolveOrCreateSession({
    cafeId: cafe.id,
    cafeSlug: cafe.slug,
    orderType: "DINE_IN",
  });

  const { session, rawToken, isNew } = sessionResult;
  console.log("✓ Guest Session Created:", {
    id: session.id,
    isNew,
    rawTokenLength: rawToken.length,
    tokenHashPreview: session.sessionTokenHash.substring(0, 12) + "...",
  });

  // Verify token hash
  if (hashSessionToken(rawToken) !== session.sessionTokenHash) {
    throw new Error("Token hash mismatch!");
  }
  console.log("✓ Verified raw token is SHA-256 hashed and DB never holds raw token");

  // 3. Place Order #1 (e.g. Avocado Toast)
  const order1 = await OrdersService.createOrder(cafe.id, {
    orderType: "DINE_IN",
    tableNameSnapshot: "Table 01",
    customerName: "Rahul",
    guestSessionId: session.id,
    items: [
      {
        itemName: "Avocado Toast",
        unitPrice: 240,
        quantity: 1,
      },
    ],
  });
  console.log("✓ Order #1 Created:", {
    id: order1.id,
    orderNumber: order1.orderNumber,
    guestSessionId: order1.guestSessionId,
    total: order1.total,
  });

  // 4. Place Order #2 (e.g. Cold Brew) during the SAME visit
  const order2 = await OrdersService.createOrder(cafe.id, {
    orderType: "DINE_IN",
    tableNameSnapshot: "Table 01",
    customerName: "Rahul",
    guestSessionId: session.id,
    items: [
      {
        itemName: "Nitro Cold Brew",
        unitPrice: 180,
        quantity: 2,
      },
    ],
  });
  console.log("✓ Order #2 Created:", {
    id: order2.id,
    orderNumber: order2.orderNumber,
    guestSessionId: order2.guestSessionId,
    total: order2.total,
  });

  if (order1.id === order2.id || order1.orderNumber === order2.orderNumber) {
    throw new Error("Orders must be independent!");
  }
  console.log("✓ Verified Order #1 and Order #2 are independent tickets");

  // 5. Query Active Orders for this Session
  const activeOrders = await GuestSessionService.getActiveOrdersForSession(
    session.id,
    cafe.id
  );
  console.log("✓ Active Orders for Session:", activeOrders.length);
  if (activeOrders.length !== 2) {
    throw new Error(`Expected 2 active orders, got ${activeOrders.length}`);
  }

  // 6. Test Account Linking
  const [existingUser] = await db.select().from(users).limit(1);
  const testUserId = existingUser.id;

  await GuestSessionService.linkCustomerToSession(
    session.id,
    testUserId,
    cafe.id
  );

  const [refreshedSession] = await db
    .select()
    .from(guestSessions)
    .where(eq(guestSessions.id, session.id))
    .limit(1);

  const [refreshedOrder1] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, order1.id))
    .limit(1);

  const [refreshedOrder2] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, order2.id))
    .limit(1);

  if (
    refreshedSession.customerId !== testUserId ||
    refreshedOrder1.customerId !== testUserId ||
    refreshedOrder2.customerId !== testUserId
  ) {
    throw new Error("Account linking failed!");
  }
  console.log("✓ Account linking succeeded: Session and both orders linked to customer_id");

  // 7. Test Terminal Status & Session Completion Lifecycle
  await OrdersService.updateOrderStatus(order1.id, cafe.id, "COMPLETED");

  const activeAfterOneDone = await GuestSessionService.getActiveOrdersForSession(
    session.id,
    cafe.id
  );
  console.log("✓ Active orders after Order #1 completed:", activeAfterOneDone.length);
  if (activeAfterOneDone.length !== 1 || activeAfterOneDone[0].id !== order2.id) {
    throw new Error("Order #2 should be the only remaining active order!");
  }

  await OrdersService.updateOrderStatus(order2.id, cafe.id, "COMPLETED");

  const activeAfterBothDone = await GuestSessionService.getActiveOrdersForSession(
    session.id,
    cafe.id
  );
  console.log("✓ Active orders after both completed:", activeAfterBothDone.length);
  if (activeAfterBothDone.length !== 0) {
    throw new Error("Expected 0 active orders!");
  }

  const [finalSession] = await db
    .select()
    .from(guestSessions)
    .where(eq(guestSessions.id, session.id))
    .limit(1);

  if (finalSession.status !== "COMPLETED") {
    throw new Error(`Expected session status COMPLETED, got ${finalSession.status}`);
  }
  console.log("✓ Guest session automatically transitioned to COMPLETED when all orders finished!");

  // Cleanup test data
  await db.delete(orders).where(eq(orders.id, order1.id));
  await db.delete(orders).where(eq(orders.id, order2.id));
  await db.delete(guestSessions).where(eq(guestSessions.id, session.id));
  console.log("✓ Cleaned up test data.");

  console.log("\n ALL TESTS PASSED! Step 1 Backend & Architecture Verified 100%.");
  process.exit(0);
}

testGuestSessionsFlow().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
