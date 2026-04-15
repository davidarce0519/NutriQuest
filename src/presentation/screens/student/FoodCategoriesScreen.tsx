import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Spacing, BorderRadius } from '../../../infrastructure/theme';

const GREEN      = '#1a6b0a';
const GREEN_DARK = '#042901';
const CARD_BG    = '#ebece7';

const CATEGORIAS = [
  { id: 1, titulo: 'Para la memoria',           img: 'https://i0.wp.com/www.buenossaborespanama.com/wp-content/uploads/2022/03/nuts-2021-08-26-15-23-41-utc-scaled.jpg?fit=1200%2C797&ssl=1' },
  { id: 2, titulo: 'Para la concentración',     img: 'https://hips.hearstapps.com/hmg-prod/images/ripe-yellow-bananas-at-the-shopping-market-fruits-royalty-free-image-1712833209.jpg' },
  { id: 3, titulo: 'Estabilizar estado de ánimo', img: 'https://s1.abcstatics.com/abc/www/multimedia/ciencia/2023/03/31/frutas-kfNH-RL11aJz79VzsPThFeaE6g5L-1200x840@abc.jpg' },
  { id: 4, titulo: 'Para mayor energía',        img: 'https://www.conasi.eu/blog/wp-content/uploads/2018/06/como-hacer-copos-de-avena-900x600.jpg' },
  { id: 5, titulo: 'Ricos en Antioxidantes',    img: 'https://eatinapp.es/sites/default/files/inline-images/antioxidantes.jpeg' },
  { id: 6, titulo: 'Para la salud cerebral',    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9XjAfbjF_rCx8kp_-j6tqq-3p2YK2Ra540g&s' },
];

export const FoodCategoriesScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={s.page}>
      {/* Header verde */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn}>
          <Text style={s.iconBtnText}>☰</Text>
        </TouchableOpacity>
        <Image
          source={require('../../../../assets/logo.png')}
          style={s.logo}
          resizeMode="contain"
        />
        <View style={s.spacer} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Tarjeta de contenido */}
        <View style={s.card}>
          {/* Título sección */}
          <View style={s.sectionRow}>
            <View style={s.titleLeft}>
              <Text style={s.titleIcon}>🍴</Text>
              <Text style={s.titleText}>Alimentos</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={s.backArrow}>❮</Text>
            </TouchableOpacity>
          </View>

          {/* Banner todos los alimentos */}
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?q=80&w=1000' }}
            style={s.banner}
            imageStyle={{ borderRadius: 18 }}
          >
            <View style={s.bannerOverlay} />
            <Text style={s.bannerText}>TODOS LOS ALIMENTOS</Text>
          </ImageBackground>

          {/* Grid 2 columnas */}
          <View style={s.grid}>
            {CATEGORIAS.map((cat) => (
              <TouchableOpacity key={cat.id} style={s.foodCard} activeOpacity={0.85}>
                <Image source={{ uri: cat.img }} style={s.foodImg} resizeMode="cover" />
                <View style={s.foodLabel}>
                  <Text style={s.foodLabelText}>{cat.titulo}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  page:      { flex: 1, backgroundColor: GREEN },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingHorizontal: 20,
    paddingTop:     50,
    paddingBottom:  10,
  },
  iconBtn: {
    width: 55, height: 55,
    borderRadius: BorderRadius.full,
    backgroundColor: GREEN_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  iconBtnText: { color: 'white', fontSize: 24 },
  logo:        { width: 120, height: 70 },
  spacer:      { width: 55 },
  scroll:      { padding: Spacing.base, paddingBottom: 40 },
  card: {
    backgroundColor: CARD_BG,
    borderRadius:    40,
    padding:         20,
    gap:             16,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 10 },
    shadowOpacity:   0.3,
    shadowRadius:    25,
    elevation:       10,
  },
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleIcon:    { fontSize: 28 },
  titleText:    { fontSize: 26, fontWeight: '900', color: GREEN_DARK },
  backArrow:    { fontSize: 26, fontWeight: '900', color: GREEN_DARK },
  banner: {
    height:      90,
    borderRadius: 18,
    overflow:    'hidden',
    alignItems:  'center',
    justifyContent: 'center',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 18,
  },
  bannerText: {
    color:      'white',
    fontSize:   20,
    fontWeight: '900',
    zIndex:     1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           14,
  },
  foodCard: {
    width:        '47%',
    borderRadius: 15,
    overflow:     'hidden',
    elevation:    4,
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  foodImg:   { width: '100%', height: 110 },
  foodLabel: {
    backgroundColor: 'white',
    minHeight:       48,
    alignItems:      'center',
    justifyContent:  'center',
    padding:         8,
  },
  foodLabelText: {
    fontSize:   13,
    fontWeight: '700',
    color:      GREEN_DARK,
    textAlign:  'center',
    lineHeight: 17,
  },
});
