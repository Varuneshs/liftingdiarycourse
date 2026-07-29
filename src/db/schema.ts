import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const exerciseDefinitions = pgTable('exercise_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const workouts = pgTable('workouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutId: uuid('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseDefinitionId: uuid('exercise_definition_id')
    .notNull()
    .references(() => exerciseDefinitions.id, { onDelete: 'restrict' }),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const sets = pgTable('sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  exerciseId: uuid('exercise_id')
    .notNull()
    .references(() => exercises.id, { onDelete: 'cascade' }),
  setNumber: integer('set_number').notNull(),
  reps: integer('reps'),
  weightKg: numeric('weight_kg', { precision: 6, scale: 2 }),
  isWarmup: boolean('is_warmup').notNull().default(false),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const workoutsRelations = relations(workouts, ({ many }) => ({
  exercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  workout: one(workouts, { fields: [exercises.workoutId], references: [workouts.id] }),
  definition: one(exerciseDefinitions, { fields: [exercises.exerciseDefinitionId], references: [exerciseDefinitions.id] }),
  sets: many(sets),
}));

export const setsRelations = relations(sets, ({ one }) => ({
  exercise: one(exercises, { fields: [sets.exerciseId], references: [exercises.id] }),
}));

export const exerciseDefinitionsRelations = relations(exerciseDefinitions, ({ many }) => ({
  exercises: many(exercises),
}));

export type ExerciseDefinition = typeof exerciseDefinitions.$inferSelect;
export type NewExerciseDefinition = typeof exerciseDefinitions.$inferInsert;
export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type Set = typeof sets.$inferSelect;
export type NewSet = typeof sets.$inferInsert;