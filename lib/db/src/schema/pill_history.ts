import { pgTable, serial, integer, text, timestamp, boolean, unique } from "drizzle-orm/pg-core";

export const pillHistoryTable = pgTable("pill_history", {
  id: serial("id").primaryKey(),
  pillId: integer("pill_id").notNull(),
  date: text("date").notNull(),
  scheduledTime: text("scheduled_time").notNull(),
  taken: boolean("taken").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("pill_history_pill_date").on(table.pillId, table.date),
]);

export type PillHistory = typeof pillHistoryTable.$inferSelect;
