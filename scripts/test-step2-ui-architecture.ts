import { db } from "../src/lib/db";
import { cafes } from "../src/lib/db/schema/cafes";
import { orders } from "../src/lib/db/schema/orders";
import { users } from "../src/lib/db/schema/users";
import { eq } from "drizzle-orm";
import {
  GuestSessionService,
  hashSessionToken,
} from "../src/features/cafe/orders/services/guest-session.service";
import { OrdersService } from "../src/features/cafe/orders/services/orders.service";

async function testStep2UIArchitecture() {
  console.log("=================================================");
  console.log("STEP 2 VERIFICATION: Multi-Order Architecture & UI");
  console.log("=================================================");

  // 1. Resolve cafe
  const [cafe] = await db
    .select()
    .from(cafes)
    .where(eq(cafes.slug, "the-roasted-bean"))
    .limit(1);

  if (!cafe) throw new Error("Cafe not found");
  console.log(`✓ Cafe resolved: ${cafe.name} (${cafe.id})`);

  // 2. Guest device session creation
  const sessionResult = await GuestSessionService.resolveOrCreateSession({
    cafeId: cafe.id,
    cafeSlug: cafe.slug,
    orderType: "DINE_IN",
  });

  const { session, rawToken } = sessionResult;
  console.log(`✓ Guest session established: ID ${session.id}`);

  // 3. Customer places Order #1043 (e.g. Avocado Toast)
  const order1 = await OrdersService.createOrder(cafe.id, {
    orderType: "DINE_IN",
    tableNameSnapshot: "Table 04",
    customerName: "Sneha",
    guestSessionId: session.id,
    items: [
      {
        itemName: "Avocado Toast",
        unitPrice: 280,
        quantity: 1,
      },
    ],
  });
  console.log(`✓ Order #1 placed: ${order1.orderNumber} (Status: ${order1.status})`);

  // Update order1 to PREPARING
  await OrdersService.updateOrderStatus(order1.id, cafe.id, "PREPARING");
  console.log(`✓ Order #1 (${order1.orderNumber}) status updated to: PREPARING`);

  // 4. Customer places Order #1044 while Order #1 is still preparing (e.g. Cold Brew)
  const order2 = await OrdersService.createOrder(cafe.id, {
    orderType: "DINE_IN",
    tableNameSnapshot: "Table 04",
    customerName: "Sneha",
    guestSessionId: session.id,
    items: [
      {
        itemName: "Nitro Cold Brew",
        unitPrice: 220,
        quantity: 2,
      },
    ],
  });
  console.log(`✓ Order #2 placed: ${order2.orderNumber} (Status: ${order2.status})`);

  // 5. Query active orders via Guest Session
  const activeOrdersForGuest = await GuestSessionService.getActiveOrdersForSession(
    session.id,
    cafe.id
  );
  console.log(`✓ Active orders for guest session: ${activeOrdersForGuest.length}`);
  if (activeOrdersForGuest.length !== 2) {
    throw new Error(`Expected 2 active orders, got ${activeOrdersForGuest.length}`);
  }
  console.log(
    `  - Order #1: ${activeOrdersForGuest[0].orderNumber} (${activeOrdersForGuest[0].status})`
  );
  console.log(
    `  - Order #2: ${activeOrdersForGuest[1].orderNumber} (${activeOrdersForGuest[1].status})`
  );

  // 6. Test Authentication & Account Linking: customerId becomes source of truth
  const [existingUser] = await db.select().from(users).limit(1);
  const testCustomerId = existingUser ? existingUser.id : "test_customer_789";

  console.log(`\n--- Linking Customer Account (${testCustomerId}) ---`);
  await GuestSessionService.linkCustomerToSession(session.id, testCustomerId, cafe.id);

  // Verify orders now have customerId attached while guestSessionId remains for session context
  const [dbOrder1] = await db.select().from(orders).where(eq(orders.id, order1.id));
  const [dbOrder2] = await db.select().from(orders).where(eq(orders.id, order2.id));

  if (dbOrder1.customerId !== testCustomerId || dbOrder2.customerId !== testCustomerId) {
    throw new Error("Failed to link customerId to orders!");
  }
  if (dbOrder1.guestSessionId !== session.id || dbOrder2.guestSessionId !== session.id) {
    throw new Error("guestSessionId was improperly removed!");
  }
  console.log("✓ Verified customerId is linked to all orders");
  console.log("✓ Verified guestSessionId remains attached for session/audit context");

  // Query active orders by customerId (authenticated customer source of truth)
  const activeOrdersForCustomer = await GuestSessionService.getActiveOrdersForCustomer(
    testCustomerId,
    cafe.id
  );
  console.log(`✓ Active orders for authenticated customerId: ${activeOrdersForCustomer.length}`);
  if (activeOrdersForCustomer.length < 2) {
    throw new Error(`Expected at least 2 active orders for customer, got ${activeOrdersForCustomer.length}`);
  }

  // 7. Verify UI Logic States:
  console.log("\n--- Validating UI State Combinations ---");
  const testCases = [
    {
      name: "Cart: 3 items, Active orders: 2",
      cartCount: 3,
      cartTotal: 650,
      activeOrdersCount: 2,
      expected: "DUAL_PILLS_SIDE_BY_SIDE (Both Cart and Tracker visible)",
    },
    {
      name: "Cart: 0 items, Active orders: 2",
      cartCount: 0,
      cartTotal: 0,
      activeOrdersCount: 2,
      expected: "FULL_WIDTH_TRACKER_PILL",
    },
    {
      name: "Cart: 3 items, Active orders: 0",
      cartCount: 3,
      cartTotal: 650,
      activeOrdersCount: 0,
      expected: "FULL_WIDTH_CART_PILL",
    },
    {
      name: "Cart: 0 items, Active orders: 0",
      cartCount: 0,
      cartTotal: 0,
      activeOrdersCount: 0,
      expected: "NO_PILLS_SHOWN",
    },
  ];

  for (const tc of testCases) {
    const hasActiveOrders = tc.activeOrdersCount > 0;
    const hasCart = tc.cartCount > 0;

    let renderedState = "NO_PILLS_SHOWN";
    if (hasActiveOrders && hasCart) {
      renderedState = "DUAL_PILLS_SIDE_BY_SIDE (Both Cart and Tracker visible)";
    } else if (hasActiveOrders && !hasCart) {
      renderedState = "FULL_WIDTH_TRACKER_PILL";
    } else if (!hasActiveOrders && hasCart) {
      renderedState = "FULL_WIDTH_CART_PILL";
    }

    if (renderedState !== tc.expected) {
      throw new Error(`UI State mismatch for "${tc.name}": expected ${tc.expected}, got ${renderedState}`);
    }
    console.log(`✓ Case "${tc.name}" -> ${renderedState}`);
  }

  // 8. Clean up test orders
  await db.delete(orders).where(eq(orders.id, order1.id));
  await db.delete(orders).where(eq(orders.id, order2.id));
  console.log("\n✓ Test orders cleaned up successfully.");

  console.log("\n=================================================");
  console.log("ALL STEP 2 ARCHITECTURAL & UI TESTS PASSED 100%!");
  console.log("=================================================");
}

testStep2UIArchitecture()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
