import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { db } from '../../db/client';
import { habitLogs, habits, categories } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BarChart, PieChart } from 'react-native-gifted-charts';

export default function InsightsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [barData, setBarData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [mostConsistent, setMostConsistent] = useState('');

  useFocusEffect(useCallback(() => { loadData(); }, [period]));

  async function loadData() {
    if (!user) return;
    const allHabits = await db.select().from(habits).where(eq(habits.userId, user.id));
    const allCategories = await db.select().from(categories).where(eq(categories.userId, user.id));
    const allLogs = await db.select().from(habitLogs);

    const now = new Date();
    let days = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - days);

    const filtered = allLogs.filter(l => new Date(l.date) >= cutoff && l.count > 0);
    setTotalLogs(filtered.length);

    // Bar chart — completions per day
    const dayMap: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dayMap[key] = 0;
    }
    filtered.forEach(l => {
      if (dayMap[l.date] !== undefined) dayMap[l.date]++;
    });

    const bar = Object.entries(dayMap).map(([date, value]) => ({
      value,
      label: date.slice(5),
      frontColor: colors.primary,
    }));
    setBarData(bar);

    // Pie chart — completions per category
    const catMap: Record<number, { count: number; name: string; colour: string }> = {};
    allCategories.forEach(c => {
      catMap[c.id] = { count: 0, name: c.name, colour: c.colour };
    });
    filtered.forEach(log => {
      const habit = allHabits.find(h => h.id === log.habitId);
      if (habit && catMap[habit.categoryId]) {
        catMap[habit.categoryId].count++;
      }
    });
    const pie = Object.values(catMap)
      .filter(c => c.count > 0)
      .map(c => ({ value: c.count, color: c.colour, text: c.name }));
    setPieData(pie);

    // Most consistent habit
    const habitCounts: Record<number, number> = {};
    filtered.forEach(l => {
      habitCounts[l.habitId] = (habitCounts[l.habitId] || 0) + 1;
    });
    const topId = Object.entries(habitCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topHabit = allHabits.find(h => h.id === Number(topId));
    setMostConsistent(topHabit?.name ?? 'None yet');
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>📊 Insights</Text>

      {/* Period toggle */}
      <View style={styles.toggleRow}>
        {(['daily', 'weekly', 'monthly'] as const).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.toggleBtn, {
              backgroundColor: period === p ? colors.primary : colors.card,
              borderColor: colors.border,
            }]}
            onPress={() => setPeriod(p)}
          >
            <Text style={{ color: period === p ? '#fff' : colors.text, fontWeight: '600' }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>{totalLogs}</Text>
          <Text style={[styles.summaryLabel, { color: colors.subtext }]}>Completions</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>🏆</Text>
          <Text style={[styles.summaryLabel, { color: colors.subtext }]}>{mostConsistent}</Text>
        </View>
      </View>

      {/* Bar chart */}
      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Completions Over Time</Text>
        {barData.length > 0 ? (
          <BarChart
            data={barData}
            width={300}
            height={180}
            barWidth={period === 'monthly' ? 6 : 20}
            noOfSections={4}
            barBorderRadius={4}
            yAxisTextStyle={{ color: colors.subtext, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.subtext, fontSize: 9 }}
            hideRules
            isAnimated
          />
        ) : (
          <Text style={[styles.noData, { color: colors.subtext }]}>No data yet</Text>
        )}
      </View>

      {/* Pie chart */}
      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>By Category</Text>
        {pieData.length > 0 ? (
          <View style={styles.pieContainer}>
            <PieChart
              data={pieData}
              donut
              radius={90}
              innerRadius={55}
              centerLabelComponent={() => (
                <Text style={[styles.pieCenter, { color: colors.text }]}>
                  {totalLogs}{'\n'}total
                </Text>
              )}
            />
            <View style={styles.legend}>
              {pieData.map((item, i) => (
                <View key={i} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: colors.text }]}>
                    {item.text}: {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={[styles.noData, { color: colors.subtext }]}>No data yet</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  toggleBtn: { flex: 1, padding: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  summaryCard: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 28, fontWeight: 'bold' },
  summaryLabel: { fontSize: 13, marginTop: 4 },
  chartCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  chartTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  noData: { textAlign: 'center', padding: 24 },
  pieContainer: { alignItems: 'center' },
  pieCenter: { textAlign: 'center', fontSize: 14, fontWeight: 'bold' },
  legend: { marginTop: 16, width: '100%' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendText: { fontSize: 14 },
});