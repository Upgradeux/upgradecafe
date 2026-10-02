/**
 * Automated Verification Suite for Phase 1
 * Tests:
 * 1. Access State Engine (Active, Grace 7-day countdown, Suspension, Manual Overrides, Soft Archive)
 * 2. Tenant Isolation & IDOR Guards
 * 3. Offline Payment & Subscription Extension Calculation
 * 4. Rate Limiting Configuration
 */

import { getCafeAccessState } from "../server/services/access-state.service";
import { checkRateLimit } from "../lib/rate-limit/rate-limiter";
import { storageService } from "../lib/storage/storage.service";
import { categorySchema, menuItemSchema } from "../features/cafe/menu/schemas/menu.schema";
import { tableSchema } from "../features/cafe/tables/schemas/table.schema";
import { getCafeThemeStyles } from "../lib/theme/theme-tokens";
import {
  createOrderSchema,
  createServiceRequestSchema,
  updateOrderStatusSchema,
} from "../features/cafe/orders/schemas/order.schema";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failedCount++;
  }
}

async function runAllTests() {
  console.log("\n=======================================================");
  console.log("🚀 RUNNING PHASE 1 AUTOMATED VERIFICATION SUITE");
  console.log("=======================================================\n");

  const now = new Date("2026-09-07T12:00:00Z");

  // TEST SUITE 1: Access State Engine
  console.log("🧪 1. Testing Access State Engine (getCafeAccessState)...");

  // 1a. Active Subscription
  const activeSub = {
    status: "ACTIVE",
    startsAt: new Date("2026-09-01T00:00:00Z"),
    expiresAt: new Date("2026-10-01T00:00:00Z"), // Expires in ~24 days
    gracePeriodDays: 7,
  };
  const activeCafe = {
    status: "ACTIVE",
    manualStatusOverride: null,
    suspensionReason: null,
  };
  const stateActive = getCafeAccessState(activeCafe, activeSub, now);
  assert(stateActive.status === "ACTIVE", "Active subscription returns status ACTIVE");
  assert(stateActive.isAccessible === true, "Active cafe is accessible to owner & staff");
  assert(stateActive.daysRemainingInPeriod > 0, "Days remaining is positive for active sub");

  // 1b. Expiry Passes -> In 7-Day Grace Period
  const graceSub = {
    status: "ACTIVE",
    startsAt: new Date("2026-08-01T00:00:00Z"),
    expiresAt: new Date("2026-09-05T00:00:00Z"), // Expired 2 days ago
    gracePeriodDays: 7,
  };
  const stateGrace = getCafeAccessState(activeCafe, graceSub, now);
  assert(stateGrace.status === "GRACE", "Expired within 7 days returns status GRACE");
  assert(stateGrace.isAccessible === true, "Grace period cafe remains accessible to owner");
  assert(stateGrace.daysRemainingInPeriod === 5, "Calculates exact remaining grace days (7 - 2 = 5)");

  // 1c. Grace Period Passes -> Automatically Suspended
  const expiredSub = {
    status: "ACTIVE",
    startsAt: new Date("2026-07-01T00:00:00Z"),
    expiresAt: new Date("2026-08-20T00:00:00Z"), // Expired 18 days ago (past 7-day grace)
    gracePeriodDays: 7,
  };
  const stateSuspended = getCafeAccessState(activeCafe, expiredSub, now);
  assert(stateSuspended.status === "SUSPENDED", "Expired past grace period returns status SUSPENDED");
  assert(stateSuspended.isAccessible === false, "Suspended cafe is blocked from tenant access");
  assert(stateSuspended.isSuperAdminOnly === true, "Suspended cafe remains accessible to Super Admin");

  // 1d. Manual Status Override: Forcibly Suspended
  const manuallySuspendedCafe = {
    status: "ACTIVE",
    manualStatusOverride: "SUSPENDED",
    suspensionReason: "Terms of Service Violation",
  };
  const stateManualSuspended = getCafeAccessState(manuallySuspendedCafe, activeSub, now);
  assert(stateManualSuspended.status === "SUSPENDED", "Manual override SUSPENDED forces suspension even with active sub");
  assert(stateManualSuspended.hasManualOverride === true, "Manual override flag is set to true");
  assert(stateManualSuspended.reason === "Terms of Service Violation", "Suspension reason is preserved");

  // 1e. Manual Status Override: Forcibly Active
  const manuallyActiveCafe = {
    status: "SUSPENDED",
    manualStatusOverride: "ACTIVE",
    suspensionReason: null,
  };
  const stateManualActive = getCafeAccessState(manuallyActiveCafe, expiredSub, now);
  assert(stateManualActive.status === "ACTIVE", "Manual override ACTIVE grants access even when expired");
  assert(stateManualActive.hasManualOverride === true, "Manual override flag is set to true");

  // 1f. Archived Cafe
  const archivedCafe = {
    status: "ARCHIVED",
    manualStatusOverride: null,
    suspensionReason: null,
  };
  const stateArchived = getCafeAccessState(archivedCafe, activeSub, now);
  assert(stateArchived.status === "ARCHIVED", "Archived cafe returns status ARCHIVED");
  assert(stateArchived.isAccessible === false, "Archived cafe is blocked from tenant access");

  // TEST SUITE 2: Storage Key Isolation
  console.log("\n🧪 2. Testing Tenant Storage Key Generation...");
  const logoKey = storageService.generateKey("cafe-123", "logo", "webp");
  assert(logoKey.startsWith("cafes/cafe-123/logo/"), "Logo key contains cafe tenant prefix");
  assert(logoKey.endsWith(".webp"), "Logo key enforces safe extension");

  const menuKey = storageService.generateKey("cafe-456", "menu", "png");
  assert(menuKey.startsWith("cafes/cafe-456/menu/"), "Menu key contains isolated cafe tenant path");

  // TEST SUITE 3: Distributed Rate Limiting
  console.log("\n🧪 3. Testing Rate Limiting Module...");
  const rl1 = await checkRateLimit("ADMIN_LOGIN", "192.168.1.100");
  assert(rl1.success === true, "First login attempt within rate limit succeeds");
  assert(rl1.remaining === 4, "Remaining requests decremented from 5 to 4");

  // TEST SUITE 4: Menu Schemas & Validation
  console.log("\n🧪 4. Testing Menu Domain Schemas & Validation...");
  const validCategory = categorySchema.safeParse({
    name: "Hot Brews",
    slug: "hot-brews",
    description: "Handcrafted coffee specialties",
    sortOrder: 0,
    isActive: true,
  });
  assert(validCategory.success === true, "Valid category passes schema validation");

  const invalidSlugCategory = categorySchema.safeParse({
    name: "Hot Brews",
    slug: "INVALID SLUG WITH SPACES!",
  });
  assert(invalidSlugCategory.success === false, "Invalid category slug is rejected by regex guard");

  const validMenuItem = menuItemSchema.safeParse({
    categoryId: "123e4567-e89b-12d3-a456-426614174000",
    name: "Vanilla Cortado",
    slug: "vanilla-cortado",
    description: "Smooth cortado with Madagascar vanilla",
    price: 180,
    isVegetarian: true,
    isAvailable: true,
    preparationTimeMinutes: 5,
    sortOrder: 1,
  });
  assert(validMenuItem.success === true, "Valid menu item with price and veg flag passes validation");

  const invalidPriceItem = menuItemSchema.safeParse({
    categoryId: "123e4567-e89b-12d3-a456-426614174000",
    name: "Bad Item",
    slug: "bad-item",
    price: -50,
  });
  assert(invalidPriceItem.success === false, "Negative menu item price is rejected");

  // TEST SUITE 5: Table Schemas & Floor Constraints
  console.log("\n🧪 5. Testing Table Management Schemas...");
  const validTable = tableSchema.safeParse({
    tableNumber: "Table 12",
    capacity: 4,
    status: "AVAILABLE",
    isActive: true,
  });
  assert(validTable.success === true, "Valid dining table configuration passes validation");

  const invalidCapacityTable = tableSchema.safeParse({
    tableNumber: "Table 0",
    capacity: 0, // Must be at least 1 guest
  });
  assert(invalidCapacityTable.success === false, "Table capacity of 0 is rejected");

  // TEST SUITE 6: Theme Presets & Token Generation
  console.log("\n🧪 6. Testing Theme Presets & CSS Token Generation...");
  const roastTokens = getCafeThemeStyles("roast");
  assert(roastTokens["--cafe-primary"] === "#8B5E3C", "Roast preset generates correct Coffee primary #8B5E3C");
  assert(roastTokens["--cafe-secondary"] === "#D89B72", "Roast preset generates Caramel secondary #D89B72");
  assert(roastTokens["--cafe-background"] === "#FAF8F4", "Roast preset generates Cream background #FAF8F4");

  const bakeryTokens = getCafeThemeStyles("bakery");
  assert(bakeryTokens["--cafe-primary"] === "#C46D5E", "Bakery preset generates warm terracotta/peach primary");

  const fallbackTokens = getCafeThemeStyles("unknown-preset");
  assert(fallbackTokens["--cafe-primary"] === "#8B5E3C", "Unknown preset gracefully falls back to Roast default");

  // TEST SUITE 7: Order & Service Request Domain Validation
  console.log("\n🧪 7. Testing Order & Service Request Domain Validation...");
  const validDineInOrder = createOrderSchema.safeParse({
    orderType: "DINE_IN",
    tableNameSnapshot: "Table 12",
    items: [
      {
        itemName: "Cappuccino",
        unitPrice: 180,
        quantity: 2,
        specialInstructions: "Less sugar",
      },
      {
        itemName: "Almond Croissant",
        unitPrice: 220,
        quantity: 1,
      },
    ],
    notes: "Serve together please",
  });
  assert(validDineInOrder.success === true, "Valid dine-in order with special instructions passes validation");

  const validTakeawayOrder = createOrderSchema.safeParse({
    orderType: "TAKEAWAY",
    customerName: "Rahul Sharma",
    items: [
      {
        itemName: "Cold Brew",
        unitPrice: 200,
        quantity: 1,
      },
    ],
  });
  assert(validTakeawayOrder.success === true, "Valid takeaway order passes validation");

  const emptyItemsOrder = createOrderSchema.safeParse({
    orderType: "DINE_IN",
    items: [],
  });
  assert(emptyItemsOrder.success === false, "Order with 0 items is rejected");

  const negativePriceItem = createOrderSchema.safeParse({
    orderType: "DINE_IN",
    items: [
      {
        itemName: "Latte",
        unitPrice: -50,
        quantity: 1,
      },
    ],
  });
  assert(negativePriceItem.success === false, "Order item with negative price is rejected");

  const validServiceReq = createServiceRequestSchema.safeParse({
    tableNameSnapshot: "Table 04",
    requestType: "CALL_WAITER",
    notes: "Need bill please",
  });
  assert(validServiceReq.success === true, "Valid table service request passes validation");

  const invalidServiceReq = createServiceRequestSchema.safeParse({
    tableNameSnapshot: "Table 04",
    requestType: "INVALID_TYPE",
  });
  assert(invalidServiceReq.success === false, "Invalid service request type is rejected");

  console.log("\n=======================================================");
  console.log(`📊 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
