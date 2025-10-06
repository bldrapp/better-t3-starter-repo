import { sql } from "drizzle-orm";
import { pgTableCreator, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `starter-repo_${name}`);

export const defaultFields = {
	id: uuid("id").primaryKey().defaultRandom(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
	deletedAt: timestamp("deleted_at", { withTimezone: true }),
};
