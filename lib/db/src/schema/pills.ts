import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pillsTable = pgTable("pills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  steps: text("steps").notNull().default(""),
  scheduledTime: text("scheduled_time").notNull(),
  daysOfWeek: text("days_of_week").notNull().default("Sun,Mon,Tue,Wed,Thu,Fri,Sat"),
  done: boolean("done").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPillSchema = createInsertSchema(pillsTable).omit({ id: true, done: true, createdAt: true, updatedAt: true });
export type InsertPill = z.infer<typeof insertPillSchema>;
export type Pill = typeof pillsTable.$inferSelect;
