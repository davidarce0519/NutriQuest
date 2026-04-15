import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { foodRepository } from '../../../data/repositories/foodRepository';
import { Food } from '../../../domain/models';
import { BorderRadius, Spacing } from '../../../infrastructure/theme';

const GREEN      = '#1a6b0a';
const GREEN_DARK = '#042901';
const CARD_BG    = '#f2f2ed';
const BG_PAGE    = '#d9d6cc';

const DEMO_FOODS = [
  { id: '1',  name: 'Fresas',      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsch2cerK6ZAai_el3L0Iii-uh3q9oEx870A&s' },
  { id: '2',  name: 'Nueces',      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQitBh0S521KAkpuEfDuPl__EnilYR8GysJqQ&s' },
  { id: '3',  name: 'Chocolate N', imageUrl: 'https://babyshowerchocolate.com/cdn/shop/articles/chocolate_hero1-d62e5444a8734f8d8fe91f5631d51ca5.jpg?v=1694433941' },
  { id: '4',  name: 'Espinacas',   imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOld9xGviBX85Kqw-DRoXACG_XVlwPnGgujg&s' },
  { id: '5',  name: 'Tomates',     imageUrl: 'https://cdn.wikifarmer.com/images/thumbnail/2020/11/Cosas-que-no-sabias-del-tomate.jpg' },
  { id: '6',  name: 'Brócoli',     imageUrl: 'https://mejorconsalud.as.com/wp-content/uploads/2015/06/brocoli-ramas.jpg' },
  { id: '7',  name: 'Aguacate',    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1Wa_7BJINzSAHGlJjiYk1U3xA2CbmmxEIvA&s' },
  { id: '8',  name: 'Manzanas',    imageUrl: 'https://www.bupasalud.com.co/sites/default/files/inline-images/fuji-red.jpg' },
  { id: '9',  name: 'Huevos',      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmvbFZLsjqcEyyIzifrg7NPv6-i1njdVIJkg&s' },
  { id: '10', name: 'Miel',        imageUrl: 'https://granvita.com/wp-content/uploads/2024/02/miel-endulzante-natural-beneficios.jpg' },
  { id: '11', name: 'Banano',      imageUrl: 'https://hips.hearstapps.com/hmg-prod/images/ripe-yellow-bananas-at-the-shopping-market-fruits-royalty-free-image-1712833209.jpg' },
  { id: '12', name: 'Avena',       imageUrl: 'https://www.conasi.eu/blog/wp-content/uploads/2018/06/como-hacer-copos-de-avena-900x600.jpg' },
];

export const FoodCatalogScreen = () => {
  const [foods, setFoods]     = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    foodRepository.getAll().then(setFoods).finally(() => setLoading(false));
  }, []);

  const display = foods.length > 0 ? foods : DEMO_FOODS;

  return (
    <View style={s.page}>
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn}>
          <Text style={s.iconBtnText}>☰</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Catálogo</Text>
        <TouchableOpacity style={s.iconBtn}>
          <Text style={s.iconBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="white" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.card}>
            <View style={s.sectionRow}>
              <View style={s.sectionLeft}>
                <Text style={s.sectionIcon}>🍴</Text>
                <Text style={s.sectionTitle}>Alimentos</Text>
              </View>
            </View>

            <TouchableOpacity style={s.banner}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?q=80&w=1000' }} style={s.bannerImg} resizeMode="cover" />
              <Text style={s.bannerText}>Todos los alimentos</Text>
            </TouchableOpacity>

            <View style={s.grid}>
              {display.map((f) => (
                <TouchableOpacity key={f.id} style={s.foodCard} activeOpacity={0.85}>
                  <Image source={{ uri: f.imageUrl ?? 'https://via.placeholder.com/100' }} style={s.foodImg} resizeMode="cover" />
                  <View style={s.foodLabel}>
                    <Text style={s.foodLabelText} numberOfLines={2}>{f.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={s.moreBtn}>
              <Text style={s.moreBtnArrow}>▼</Text>
              <Text style={s.moreBtnText}>MÁS ALIMENTOS</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  page:   { flex: 1, backgroundColor: BG_PAGE },
  header: {
    backgroundColor: GREEN,
    height:          100,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingHorizontal: 25,
    marginBottom:    25,
    elevation:       10,
  },
  iconBtn: {
    width: 58, height: 58,
    borderRadius: BorderRadius.full,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText:  { color: 'white', fontSize: 28, fontWeight: '900' },
  headerTitle:  { color: 'white', fontSize: 28, fontWeight: '900' },
  scroll:       { paddingHorizontal: Spacing.base, paddingBottom: 40 },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 45,
    padding: 22,
    gap: 18,
    elevation: 8,
  },
  sectionRow:   { flexDirection: 'row', alignItems: 'center' },
  sectionLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionIcon:  { fontSize: 28 },
  sectionTitle: { fontSize: 28, fontWeight: '900', color: GREEN_DARK },
  banner:       { borderRadius: 25, overflow: 'hidden', elevation: 4 },
  bannerImg:    { width: '100%', height: 90 },
  bannerText:   { padding: 12, fontSize: 22, fontWeight: '900', color: GREEN_DARK, backgroundColor: 'white' },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  foodCard: {
    width:        '31%',
    borderRadius: 15,
    overflow:     'hidden',
    backgroundColor: 'white',
    elevation:    4,
  },
  foodImg:      { width: '100%', height: 75 },
  foodLabel:    { backgroundColor: GREEN_DARK, minHeight: 32, alignItems: 'center', justifyContent: 'center', padding: 4 },
  foodLabelText:{ color: 'white', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  moreBtn:      { alignItems: 'center', marginTop: 10, gap: 2 },
  moreBtnArrow: { fontSize: 38, color: GREEN_DARK, fontWeight: '900' },
  moreBtnText:  { fontSize: 11, fontWeight: '900', color: GREEN_DARK, letterSpacing: 2 },
});
