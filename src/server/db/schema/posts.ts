import { defaultFields, createTable } from "../helpers";
import { index, varchar } from "drizzle-orm/pg-core";

export const posts = createTable(
	"posts",
	{
		...defaultFields,
		name: varchar("name", { length: 256 }),
	},
	(t) => [index("name_idx").on(t.name)],
);

export type Post = typeof posts.$inferSelect;
