import { sql } from "drizzle-orm";
import { getTableName } from "drizzle-orm/table";
import { customType, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

type SQLiteSchemaHook = (args: {
  schema: {
    relations: Record<string, unknown>;
    tables: Record<string, unknown>;
  };
}) => unknown;

function replaceTableBySQLName(
  tables: Record<string, unknown>,
  sqlName: string,
  replacement: unknown,
) {
  const nextTables = { ...tables };
  let replaced = false;

  for (const [key, table] of Object.entries(tables)) {
    try {
      if (getTableName(table as never) === sqlName) {
        nextTables[key] = replacement;
        replaced = true;
      }
    } catch {
      // Ignore non-table entries and preserve them as-is.
    }
  }

  if (!replaced) {
    nextTables[sqlName] = replacement;
  }

  return nextTables;
}

const datetime = customType<{ data: string; driverData: string }>({
  dataType() {
    return "DATETIME";
  },
});

export const preserveExistingTables: SQLiteSchemaHook = ({ schema }) => {
  const appointment = sqliteTable("Appointment", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    locationSlug: text("locationSlug").notNull(),
    serviceType: text("serviceType").notNull(),
    preferredDate: datetime("preferredDate").notNull(),
    preferredTimeWindow: text("preferredTimeWindow").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    notes: text("notes"),
    status: text("status").notNull().default("NEW"),
    createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime("updatedAt").notNull(),
  });

  const contactSubmission = sqliteTable("ContactSubmission", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    message: text("message").notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
  });

  const weddingRegistration = sqliteTable("WeddingRegistration", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    groomName: text("groomName").notNull(),
    brideName: text("brideName").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    weddingDate: datetime("weddingDate").notNull(),
    numberGroomsmen: integer("numberGroomsmen").notNull(),
    locationSlug: text("locationSlug"),
    notes: text("notes"),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime("updatedAt").notNull(),
  });

  const emailLog = sqliteTable("EmailLog", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    appointmentId: integer("appointmentId")
      .notNull()
      .references(() => appointment.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    toEmail: text("toEmail").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    status: text("status").notNull().default("LOGGED"),
    createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
  });

  let tables = replaceTableBySQLName(schema.tables, "Appointment", appointment);
  tables = replaceTableBySQLName(tables, "ContactSubmission", contactSubmission);
  tables = replaceTableBySQLName(tables, "WeddingRegistration", weddingRegistration);
  tables = replaceTableBySQLName(tables, "EmailLog", emailLog);

  return {
    ...schema,
    tables,
  };
};
