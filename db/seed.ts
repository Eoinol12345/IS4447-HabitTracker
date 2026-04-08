import { db } from './client';
import { users, categories, habits, habitLogs, targets } from './schema';

export async function seedDatabase() {
  try {
    // Check if already seeded
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) return;

    // Insert demo user
    await db.insert(users).values({
      email: 'demo@habits.com',
      password: 'demo1234',
    });

    // Insert categories
    await db.insert(categories).values([
      { name: 'Health', colour: '#4CAF50', userId: 1 },
      { name: 'Fitness', colour: '#2196F3', userId: 1 },
      { name: 'Learning', colour: '#9C27B0', userId: 1 },
      { name: 'Mindfulness', colour: '#FF9800', userId: 1 },
    ]);

    // Insert habits
    await db.insert(habits).values([
      { name: 'Drink 2L Water', categoryId: 1, userId: 1, createdAt: '2026-03-01' },
      { name: 'Morning Run', categoryId: 2, userId: 1, createdAt: '2026-03-01' },
      { name: 'Read 30 mins', categoryId: 3, userId: 1, createdAt: '2026-03-01' },
      { name: 'Meditate', categoryId: 4, userId: 1, createdAt: '2026-03-01' },
    ]);

    // Insert habit logs for the past 2 weeks
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      await db.insert(habitLogs).values([
        { habitId: 1, date: dateStr, count: 1, notes: '' },
        { habitId: 2, date: dateStr, count: i % 3 === 0 ? 0 : 1, notes: '' },
        { habitId: 3, date: dateStr, count: 1, notes: '' },
        { habitId: 4, date: dateStr, count: i % 2 === 0 ? 1 : 0, notes: '' },
      ]);
    }

    // Insert targets
    await db.insert(targets).values([
      { habitId: 1, categoryId: null, period: 'weekly', goal: 7, userId: 1 },
      { habitId: 2, categoryId: null, period: 'weekly', goal: 5, userId: 1 },
      { habitId: 3, categoryId: null, period: 'monthly', goal: 20, userId: 1 },
      { habitId: 4, categoryId: null, period: 'weekly', goal: 6, userId: 1 },
    ]);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Seeding error:', error);
  }
}