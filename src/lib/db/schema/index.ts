import { relations } from "drizzle-orm";
import { users } from "./users";
import { sessions, accounts } from "./auth-tables";
import { cafes } from "./cafes";
import { cafeMemberships } from "./memberships";
import { plans } from "./plans";
import { subscriptions } from "./subscriptions";
import { payments } from "./payments";
import { auditLogs } from "./audit-logs";
import { categories } from "./categories";
import { menuItems, menuItemVariants } from "./menu-items";
import { tables } from "./tables";
import { floors } from "./floors";
import { cafeSettings } from "./cafe-settings";
import { orders, orderItems, serviceRequests } from "./orders";
import { guestSessions } from "./guest-sessions";
import { offers } from "./offers";

export * from "./users";
export * from "./auth-tables";
export * from "./cafes";
export * from "./memberships";
export * from "./plans";
export * from "./subscriptions";
export * from "./payments";
export * from "./audit-logs";
export * from "./categories";
export * from "./menu-items";
export * from "./floors";
export * from "./tables";
export * from "./cafe-settings";
export * from "./guest-sessions";
export * from "./orders";
export * from "./offers";
export * from "./waitlist";
export * from "./modifiers";

// Define Drizzle Relations for clean relational queries
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  memberships: many(cafeMemberships),
  recordedPayments: many(payments),
  auditLogs: many(auditLogs),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const cafesRelations = relations(cafes, ({ one, many }) => ({
  memberships: many(cafeMemberships),
  subscriptions: many(subscriptions),
  payments: many(payments),
  auditLogs: many(auditLogs),
  categories: many(categories),
  menuItems: many(menuItems),
  tables: many(tables),
  orders: many(orders),
  offers: many(offers),
  serviceRequests: many(serviceRequests),
  settings: one(cafeSettings, {
    fields: [cafes.id],
    references: [cafeSettings.cafeId],
  }),
}));

export const cafeMembershipsRelations = relations(cafeMemberships, ({ one }) => ({
  user: one(users, {
    fields: [cafeMemberships.userId],
    references: [users.id],
  }),
  cafe: one(cafes, {
    fields: [cafeMemberships.cafeId],
    references: [cafes.id],
  }),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  cafe: one(cafes, {
    fields: [subscriptions.cafeId],
    references: [cafes.id],
  }),
  plan: one(plans, {
    fields: [subscriptions.planId],
    references: [plans.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  cafe: one(cafes, {
    fields: [payments.cafeId],
    references: [cafes.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
  recordedBy: one(users, {
    fields: [payments.recordedByUserId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorUserId],
    references: [users.id],
  }),
  cafe: one(cafes, {
    fields: [auditLogs.cafeId],
    references: [cafes.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  cafe: one(cafes, {
    fields: [categories.cafeId],
    references: [cafes.id],
  }),
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  cafe: one(cafes, {
    fields: [menuItems.cafeId],
    references: [cafes.id],
  }),
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
  variants: many(menuItemVariants),
}));

export const menuItemVariantsRelations = relations(menuItemVariants, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [menuItemVariants.menuItemId],
    references: [menuItems.id],
  }),
}));

export const tablesRelations = relations(tables, ({ one, many }) => ({
  cafe: one(cafes, {
    fields: [tables.cafeId],
    references: [cafes.id],
  }),
  orders: many(orders),
  serviceRequests: many(serviceRequests),
}));

export const cafeSettingsRelations = relations(cafeSettings, ({ one }) => ({
  cafe: one(cafes, {
    fields: [cafeSettings.cafeId],
    references: [cafes.id],
  }),
}));

export const guestSessionsRelations = relations(guestSessions, ({ one, many }) => ({
  cafe: one(cafes, {
    fields: [guestSessions.cafeId],
    references: [cafes.id],
  }),
  table: one(tables, {
    fields: [guestSessions.tableId],
    references: [tables.id],
  }),
  customer: one(users, {
    fields: [guestSessions.customerId],
    references: [users.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  cafe: one(cafes, {
    fields: [orders.cafeId],
    references: [cafes.id],
  }),
  table: one(tables, {
    fields: [orders.tableId],
    references: [tables.id],
  }),
  guestSession: one(guestSessions, {
    fields: [orders.guestSessionId],
    references: [guestSessions.id],
  }),
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

export const serviceRequestsRelations = relations(serviceRequests, ({ one }) => ({
  cafe: one(cafes, {
    fields: [serviceRequests.cafeId],
    references: [cafes.id],
  }),
  table: one(tables, {
    fields: [serviceRequests.tableId],
    references: [tables.id],
  }),
}));
