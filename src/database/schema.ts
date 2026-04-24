import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const fetchLogsTable = pgTable('fetch_logs', {
  id: text('id').primaryKey(),
  date: date('fetch_date', { mode: 'date' }).notNull(),
  keyword: text('keyword').notNull(),
  type: text('article_type').notNull(),
  countUniqueArticles: integer('count_unique_articles').notNull(),
  notified: boolean('notified').notNull().default(false),
});

export const articlesTable = pgTable('articles', {
  id: text('id').primaryKey(),
  fetchId: text('fetch_id')
    .notNull()
    .references(() => fetchLogsTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  originalLink: text('original_link').notNull(),
  description: text('description'),
  pubDate: timestamp('pub_date', { withTimezone: true, mode: 'date' }).notNull(),
  mediaName: text('media_name'),
});

export const mediaNamesTable = pgTable('media_names', {
  domain: text('domain').primaryKey(),
  name: text('name'),
});

export const scrappersTable = pgTable('scrappers', {
  id: uuid('id').default(sql`uuid_generate_v4()`).primaryKey(),
  name: text('scrapper_name').notNull(),
  type: text('type').notNull(),
  activated: boolean('activated').notNull().default(false),
  keyword: text('keyword').notNull(),
});

export const notificatorsTable = pgTable('notificators', {
  id: uuid('id').default(sql`uuid_generate_v4()`).primaryKey(),
  name: text('name').notNull(),
  channelType: text('channel_type').notNull(),
  channelApiUrl: text('channel_api_url').notNull(),
  channelApiKey: text('channel_api_key'),
  activated: boolean('activated').notNull().default(false),
});

export const schedulesTable = pgTable(
  'schedules',
  {
    id: uuid('id').default(sql`uuid_generate_v4()`).notNull(),
    day: integer('day').notNull(),
    start: integer('start').notNull(),
    end: integer('end').notNull(),
    interval: integer('interval').notNull(),
    scrapperId: uuid('scrapper_id').references(() => scrappersTable.id, { onDelete: 'cascade' }),
    notificatorId: uuid('notificator_id').references(() => notificatorsTable.id, {
      onDelete: 'cascade',
    }),
  },
  (table) => [
    primaryKey({
      name: 'schedules_pkey',
      columns: [table.id, table.day],
    }),
    check(
      'fk check',
      sql`((${table.scrapperId} is not null and ${table.notificatorId} is null) or (${table.scrapperId} is null and ${table.notificatorId} is not null))`,
    ),
  ],
);

export const pushSubscriptionTable = pgTable('push_subscription', {
  endpoint: text('endpoint').primaryKey(),
  p256dhKey: text('p256dh_key').notNull(),
  authKey: text('auth_key').notNull(),
  activated: boolean('activated').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: false, mode: 'date' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at', { withTimezone: false, mode: 'date' }),
});

export const usersTable = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  username: text('username').notNull(),
  password: text('password').notNull(),
  role: text('role').notNull(),
  created: date('created', { mode: 'date' }).notNull().default(sql`CURRENT_DATE`),
});

export const fetchLogsRelations = relations(fetchLogsTable, ({ many }) => ({
  articles: many(articlesTable),
}));

export const articlesRelations = relations(articlesTable, ({ one }) => ({
  fetchLog: one(fetchLogsTable, {
    fields: [articlesTable.fetchId],
    references: [fetchLogsTable.id],
  }),
}));

export const scrappersRelations = relations(scrappersTable, ({ many }) => ({
  schedules: many(schedulesTable),
}));

export const notificatorsRelations = relations(notificatorsTable, ({ many }) => ({
  schedules: many(schedulesTable),
}));

export const schedulesRelations = relations(schedulesTable, ({ one }) => ({
  scrapper: one(scrappersTable, {
    fields: [schedulesTable.scrapperId],
    references: [scrappersTable.id],
  }),
  notificator: one(notificatorsTable, {
    fields: [schedulesTable.notificatorId],
    references: [notificatorsTable.id],
  }),
}));
