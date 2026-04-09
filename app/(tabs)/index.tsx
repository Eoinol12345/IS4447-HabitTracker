import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Alert, Modal
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { db } from '../../db/client';
import { habits, habitLogs, categories } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function HabitsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [habitList, setHabitList] = useState<any[]>([]);
  const [categoryList, setCategoryList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, []));

  async function loadData() {
    if (!user) return;
    const h = await db.select().from(habits).where(eq(habits.userId, user.id));
    const c = await db.select().from(categories).where(eq(categories.userId, user.id));
    const logs = await db.select().from(habitLogs);
    const enriched = h.map(habit => {
      const cat = c.find(c => c.id === habit.categoryId);
      const todayLog = logs.find(l => l.habitId === habit.id && l.date === today);
      return { ...habit, category: cat, completedToday: !!todayLog };
    });
    setHabitList(enriched);
    setCategoryList(c);
  }

  async function toggleComplete(habit: any) {
    const existing = await db.select().from(habitLogs)
      .where(and(eq(habitLogs.habitId, habit.id), eq(habitLogs.date, today)));
    if (existing.length > 0) {
      await db.delete(habitLogs).where(eq(habitLogs.id, existing[0].id));
    } else {
      await db.insert(habitLogs).values({ habitId: habit.id, date: today, count: 1, notes: '' });
    }
    await loadData();
  }

  async function saveHabit() {
    if (!name || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (editingHabit) {
      await db.update(habits)
        .set({ name, categoryId: selectedCategory })
        .where(eq(habits.id, editingHabit.id));
    } else {
      await db.insert(habits).values({
        name, categoryId: selectedCategory,
        userId: user!.id, createdAt: today,
      });
    }
    setModalVisible(false);
    setName('');
    setSelectedCategory(null);
    setEditingHabit(null);
    await loadData();
  }

  async function deleteHabit(id: number) {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await db.delete(habits).where(eq(habits.id, id));
        await db.delete(habitLogs).where(eq(habitLogs.habitId, id));
        await loadData();
      }},
    ]);
  }

  const filtered = habitList.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>🌱 My Habits</Text>

      <TextInput
        style={[styles.search, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="Search habits..."
        placeholderTextColor={colors.subtext}
        value={search}
        onChangeText={setSearch}
        accessibilityLabel="Search habits"
      />

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            No habits yet. Tap + to add one!
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.checkbox, {
                  borderColor: colors.primary,
                  backgroundColor: item.completedToday ? colors.primary : 'transparent'
                }]}
                onPress={() => toggleComplete(item)}
                accessibilityLabel={`Toggle ${item.name}`}
              >
                {item.completedToday && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <View style={styles.cardContent}>
                <Text style={[styles.habitName, { color: colors.text }]}>{item.name}</Text>
                {item.category && (
                  <View style={[styles.badge, { backgroundColor: item.category.colour + '33' }]}>
                    <Text style={[styles.badgeText, { color: item.category.colour }]}>
                      {item.category.name}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => {
                setEditingHabit(item);
                setName(item.name);
                setSelectedCategory(item.categoryId);
                setModalVisible(true);
              }}>
                <Text style={[styles.action, { color: colors.primary }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteHabit(item.id)}>
                <Text style={[styles.action, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          setEditingHabit(null);
          setName('');
          setSelectedCategory(null);
          setModalVisible(true);
        }}
        accessibilityLabel="Add habit"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingHabit ? 'Edit Habit' : 'New Habit'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Habit name"
              placeholderTextColor={colors.subtext}
              value={name}
              onChangeText={setName}
              accessibilityLabel="Habit name input"
            />
            <Text style={[styles.label, { color: colors.subtext }]}>Category</Text>
            <View style={styles.categoryRow}>
              {categoryList.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, {
                    backgroundColor: selectedCategory === cat.id ? cat.colour : cat.colour + '33',
                    borderColor: cat.colour,
                  }]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={{ color: selectedCategory === cat.id ? '#fff' : cat.colour, fontWeight: '600' }}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={saveHabit}
              >
                <Text style={{ color: '#fff' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  search: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkmark: { color: '#fff', fontWeight: 'bold' },
  cardContent: { flex: 1 },
  habitName: { fontSize: 16, fontWeight: '500' },
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  action: { fontSize: 14, fontWeight: '600', marginLeft: 12 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 8 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
});