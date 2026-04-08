import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Alert, Modal
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { db } from '../../db/client';
import { categories } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const COLOURS = [
  '#4CAF50', '#2196F3', '#9C27B0', '#FF9800',
  '#F44336', '#00BCD4', '#FF5722', '#607D8B'
];

export default function CategoriesScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [categoryList, setCategoryList] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [name, setName] = useState('');
  const [selectedColour, setSelectedColour] = useState(COLOURS[0]);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function loadData() {
    if (!user) return;
    const c = await db.select().from(categories).where(eq(categories.userId, user.id));
    setCategoryList(c);
  }

  async function saveCategory() {
    if (!name) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    if (editingCategory) {
      await db.update(categories)
        .set({ name, colour: selectedColour })
        .where(eq(categories.id, editingCategory.id));
    } else {
      await db.insert(categories).values({
        name, colour: selectedColour, userId: user!.id
      });
    }
    setModalVisible(false);
    setName('');
    setSelectedColour(COLOURS[0]);
    setEditingCategory(null);
    loadData();
  }

  async function deleteCategory(id: number) {
    Alert.alert('Delete', 'Delete this category?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await db.delete(categories).where(eq(categories.id, id));
        loadData();
      }},
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>🏷️ Categories</Text>

      {categoryList.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            No categories yet. Tap + to add one!
          </Text>
        </View>
      ) : (
        <FlatList
          data={categoryList}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.colourDot, { backgroundColor: item.colour }]} />
              <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
              <TouchableOpacity onPress={() => {
                setEditingCategory(item);
                setName(item.name);
                setSelectedColour(item.colour);
                setModalVisible(true);
              }}>
                <Text style={[styles.action, { color: colors.primary }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteCategory(item.id)}>
                <Text style={[styles.action, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          setEditingCategory(null);
          setName('');
          setSelectedColour(COLOURS[0]);
          setModalVisible(true);
        }}
        accessibilityLabel="Add category"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingCategory ? 'Edit Category' : 'New Category'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Category name"
              placeholderTextColor={colors.subtext}
              value={name}
              onChangeText={setName}
              accessibilityLabel="Category name input"
            />
            <Text style={[styles.label, { color: colors.subtext }]}>Pick a colour</Text>
            <View style={styles.colourRow}>
              {COLOURS.map(colour => (
                <TouchableOpacity
                  key={colour}
                  style={[styles.colourOption, { backgroundColor: colour,
                    borderWidth: selectedColour === colour ? 3 : 0,
                    borderColor: colors.text
                  }]}
                  onPress={() => setSelectedColour(colour)}
                  accessibilityLabel={`Select colour ${colour}`}
                />
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
                onPress={saveCategory}
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
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  colourDot: { width: 20, height: 20, borderRadius: 10, marginRight: 12 },
  categoryName: { flex: 1, fontSize: 16, fontWeight: '500' },
  action: { fontSize: 14, fontWeight: '600', marginLeft: 12 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 8 },
  colourRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  colourOption: { width: 36, height: 36, borderRadius: 18 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
});