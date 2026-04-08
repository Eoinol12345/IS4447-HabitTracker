import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, Modal
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { db } from '../../db/client';
import { targets, habits, habitLogs } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function TargetsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [targetList, setTargetList] = useState<any[]>([]);
  const [habitList, setHabitList] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<number | null>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [goal, setGoal] = useState(5);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function loadData() {
    if (!user) return;
    const h = await db.select().from(habits).where(eq(habits.userId, user.id));
    const t = await db.select().from(targets).where(eq(targets.userId, user.id));
    const logs = await db.select().from(habitLogs);

    const now = new Date();
    const enriched = t.map(target => {
      const habit = h.find(h => h.id === target.habitId);
      let progress = 0;

      if (target.period === 'weekly') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        progress = logs.filter(l =>
          l.habitId === target.habitId &&
          new Date(l.date) >= weekAgo &&
          l.count > 0
        ).length;
      } else {
        const monthAgo = new Date(now);
        monthAgo.setDate(now.getDate() - 30);
        progress = logs.filter(l =>
          l.habitId === target.habitId &&
          new Date(l.date) >= monthAgo &&
          l.count > 0
        ).length;
      }

      return { ...target, habit, progress };
    });

    setTargetList(enriched);
    setHabitList(h);
  }

  async function saveTarget() {
    if (!selectedHabit) {
      Alert.alert('Error', 'Please select a habit');
      return;
    }
    await db.insert(targets).values({
      habitId: selectedHabit,
      categoryId: null,
      period,
      goal,
      userId: user!.id,
    });
    setModalVisible(false);
    setSelectedHabit(null);
    setPeriod('weekly');
    setGoal(5);
    loadData();
  }

  async function deleteTarget(id: number) {
    Alert.alert('Delete', 'Delete this target?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await db.delete(targets).where(eq(targets.id, id));
        loadData();
      }},
    ]);
  }

  function getStatusColor(progress: number, goal: number) {
    if (progress >= goal) return '#4CAF50';
    if (progress >= goal * 0.5) return '#FF9800';
    return colors.danger;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>🎯 Targets</Text>

      {targetList.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            No targets yet. Tap + to set a goal!
          </Text>
        </View>
      ) : (
        <FlatList
          data={targetList}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => {
            const pct = Math.min((item.progress / item.goal) * 100, 100);
            const statusColor = getStatusColor(item.progress, item.goal);
            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.habitName, { color: colors.text }]}>
                    {item.habit?.name ?? 'Unknown'}
                  </Text>
                  <TouchableOpacity onPress={() => deleteTarget(item.id)}>
                    <Text style={[styles.action, { color: colors.danger }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.period, { color: colors.subtext }]}>
                  {item.period === 'weekly' ? '📅 Weekly' : '🗓️ Monthly'} goal: {item.goal}
                </Text>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: statusColor }]} />
                </View>
                <View style={styles.progressRow}>
                  <Text style={[styles.progressText, { color: statusColor }]}>
                    {item.progress} / {item.goal} completed
                  </Text>
                  {item.progress >= item.goal ? (
                    <Text style={styles.badge}>✅ Goal Met!</Text>
                  ) : (
                    <Text style={[styles.badge, { color: colors.subtext }]}>
                      {item.goal - item.progress} remaining
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Add target"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Target</Text>

            <Text style={[styles.label, { color: colors.subtext }]}>Select Habit</Text>
            <View style={styles.chipRow}>
              {habitList.map(h => (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.chip, {
                    backgroundColor: selectedHabit === h.id ? colors.primary : colors.border,
                  }]}
                  onPress={() => setSelectedHabit(h.id)}
                >
                  <Text style={{ color: selectedHabit === h.id ? '#fff' : colors.text }}>
                    {h.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.subtext }]}>Period</Text>
            <View style={styles.chipRow}>
              {(['weekly', 'monthly'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, {
                    backgroundColor: period === p ? colors.primary : colors.border,
                  }]}
                  onPress={() => setPeriod(p)}
                >
                  <Text style={{ color: period === p ? '#fff' : colors.text }}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.subtext }]}>Goal: {goal} times</Text>
            <View style={styles.chipRow}>
              {[3, 5, 7, 10, 14, 20, 30].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.chip, {
                    backgroundColor: goal === n ? colors.primary : colors.border,
                  }]}
                  onPress={() => setGoal(n)}
                >
                  <Text style={{ color: goal === n ? '#fff' : colors.text }}>{n}</Text>
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
                onPress={saveTarget}
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
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, textAlign: 'center' },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  habitName: { fontSize: 16, fontWeight: '600' },
  action: { fontSize: 14, fontWeight: '600' },
  period: { fontSize: 13, marginBottom: 8 },
  progressBar: { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 5 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 13, fontWeight: '600' },
  badge: { fontSize: 13, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBotto