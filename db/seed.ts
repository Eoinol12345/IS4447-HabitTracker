import { db } from './client';
import { users, categories, habits, habitLogs, targets } from './schema';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  try {
    // Always ensure demo user exists
    const existingUser = await db.select().from(users)
      .where(eq(users.email, 'demo@habits.com'));

    let userId = 1;
    if (existingUser.length === 0) {
      await db.insert(users).values({
        email: 'demo@habits.com',
        password: 'demo1234',
      });
      const inserted = await db.select().from(users)
        .where(eq(users.email, 'demo@habits.com'));
      userId = inserted[0].id;
    } else {
      userId = existingUser[0].id;
    }

    // Check if categories already exist
    const existingCats = await db.select().from(categories)
      .where(eq(categories.userId, userId));

    if (existingCats.length === 0) {
      await db.insert(categories).values([
        { name: 'Health', colour: '#4CAF50', userId },
        { name: 'Fitness', colour: '#2196F3', userId },
        { name: 'Learning', colour: '#9C27B0', userId },
        { name: 'Mindfulness', colour: '#FF9800', userId },
      ]);

      const cats = await db.select().from(categories)
        .where(eq(categories.userId, userId));

      await db.insert(habits).values([
        { name: 'Drink 2L Water', categoryId: cats[0].id, userId, createdAt: '2026-03-01' },
        { name: 'Morning Run', categoryId: cats[1].id, userId, createdAt: '2026-03-01' },
        { name: 'Read 30 mins', categoryId: cats[2].id, userId, createdAt: '2026-03-01' },
        { name: 'Meditate', categoryId: cats[3].id, userId, createdAt: '2026-03-01' },
      ]);

      const allHabits = await db.select().from(habits)
        .where(eq(habits.userId, userId));

      const today = new Date();
      for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        for (const habit of allHabits) {
          await db.insert(habitLogs).values({
            habitId: habit.id,
            date: dateStr,
            count: i % 3 === 0 ? 0 : 1,
            notes: '',
          });
        }
      }

      await db.insert(targets).values([
        { habitId: allHabits[0].id, categoryId: null, period: 'weekly', goal: 7, userId },
        { habitId: allHabits[1].id, categoryId: null, period: 'weekly', goal: 5, userId },
        { habitId: allHabits[2].id, categoryId: null, period: 'monthly', goal: 20, userId },
        { habitId: allHabits[3].id, categoryId: null, period: 'weekly', goal: 6, userId },
      ]);
    }

    console.log('Seed complete. User ID:', userId);
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
}