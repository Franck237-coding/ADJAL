import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';
import { LinearGradient as LinearGradientSvg, Stop, Defs } from 'react-native-svg';
import TopBar from '@/components/farmer/TopBar';
import { MONTHLY_SALES, SALES_BY_PRODUCT } from '@/data/farmer-mock';

export default function FarmerStats() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === 'web' ? 44 : insets.top;

  const totalRevenue = MONTHLY_SALES.reduce((s, m) => s + m.value, 0);
  const totalOrders = 45;
  const totalDelivered = 38;

  const chartWidth = 320;
  const chartHeight = 180;
  const padding = { top: 20, right: 16, bottom: 30, left: 16 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const maxVal = Math.max(...MONTHLY_SALES.map((m) => m.value));
  const points = MONTHLY_SALES.map((m, i) => ({
    x: padding.left + (i / (MONTHLY_SALES.length - 1)) * innerW,
    y: padding.top + innerH - (m.value / maxVal) * innerH,
    value: m.value,
    month: m.month,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + innerH} L ${points[0].x} ${padding.top + innerH} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((r) => padding.top + innerH * (1 - r));

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <TopBar title="Statistiques" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {/* KPIs */}
        <View style={styles.kpiRow}>
          {[
            { label: 'Revenus', value: totalRevenue.toLocaleString('fr-FR') + ' FCFA', color: '#2E7D32', bg: '#E8F5E9', icon: 'cash' },
            { label: 'Commandes', value: String(totalOrders), color: '#F57F17', bg: '#FFF8E1', icon: 'bag' },
            { label: 'Livrées', value: String(totalDelivered), color: '#1565C0', bg: '#E3F2FD', icon: 'checkmark-done' },
          ].map((k) => (
            <View key={k.label} style={[styles.kpiCard, { backgroundColor: k.bg }]}>
              <View style={[styles.kpiIcon, { backgroundColor: k.color + '20' }]}>
                <Ionicons name={k.icon as any} size={18} color={k.color} />
              </View>
              <Text style={styles.kpiValue}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* Revenue chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Revenus mensuels</Text>
          <View style={styles.chartWrap}>
            <Svg width={chartWidth} height={chartHeight}>
              {gridLines.map((y, i) => (
                <Rect key={i} x={padding.left} y={y} width={innerW} height={1} fill="#EDE9E2" />
              ))}
              <Path d={areaD} fill="url(#areaGrad)" />
              <Path d={pathD} fill="none" stroke="#2E7D32" strokeWidth={2.5} />
              {points.map((p, i) => (
                <React.Fragment key={i}>
                  <Rect x={p.x - 3} y={p.y - 3} width={6} height={6} rx={3} fill="#2E7D32" />
                  <SvgText x={p.x} y={padding.top + innerH + 16} fontSize={10} fill="#6B7A6B" fontFamily="Inter_400Regular" textAnchor="middle">{p.month}</SvgText>
                  <SvgText x={p.x} y={p.y - 8} fontSize={9} fill="#6B7A6B" fontFamily="Inter_400Regular" textAnchor="middle">{(p.value / 1000).toFixed(0)}k</SvgText>
                </React.Fragment>
              ))}
              <Defs>
                <LinearGradientSvg id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#2E7D32" stopOpacity="0.2" />
                  <Stop offset="1" stopColor="#2E7D32" stopOpacity="0" />
                </LinearGradientSvg>
              </Defs>
            </Svg>
          </View>
        </View>

        {/* Product bars */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ventes par produit</Text>
          <View style={styles.barsList}>
            {SALES_BY_PRODUCT.map((p) => (
              <View key={p.name} style={styles.barRow}>
                <Text style={styles.barLabel}>{p.name}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${p.pct}%`, backgroundColor: p.color }]} />
                </View>
                <Text style={styles.barPct}>{p.pct}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Ranking */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Classement</Text>
          <View style={styles.rankList}>
            {SALES_BY_PRODUCT.map((p, i) => (
              <View key={p.name} style={styles.rankRow}>
                <View style={[styles.rankNum, { backgroundColor: p.color + '20' }]}>
                  <Text style={[styles.rankNumText, { color: p.color }]}>{i + 1}</Text>
                </View>
                <View style={styles.rankInfo}>
                  <Text style={styles.rankName}>{p.name}</Text>
                  <View style={styles.rankBar}>
                    <View style={[styles.rankBarFill, { width: `${p.pct}%`, backgroundColor: p.color }]} />
                  </View>
                </View>
                <Text style={styles.rankPct}>{p.pct}%</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1EB' },
  kpiRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  kpiCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 8 },
  kpiIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1A2E1A', textAlign: 'center' },
  kpiLabel: { fontSize: 11, color: '#6B7A6B', fontFamily: 'Inter_400Regular' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginHorizontal: 16, marginTop: 16, borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#1A2E1A', marginBottom: 14 },
  chartWrap: { alignItems: 'center' },
  barsList: { gap: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 80, fontSize: 12, fontFamily: 'Inter_500Medium', color: '#1A2E1A' },
  barTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: '#EDE9E2', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  barPct: { width: 36, fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#6B7A6B', textAlign: 'right' },
  rankList: { gap: 10 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankNum: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rankNumText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#1A2E1A' },
  rankBar: { height: 6, borderRadius: 3, backgroundColor: '#EDE9E2', marginTop: 4, overflow: 'hidden' },
  rankBarFill: { height: '100%', borderRadius: 3 },
  rankPct: { width: 36, fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1A2E1A', textAlign: 'right' },
});
