import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AGENTS } from '@artifigenz/shared';
import { colors, spacing } from '../../constants/theme';
import Header from '../../components/Header';

export default function ExploreScreen() {
  const scheme = useColorScheme();
  const c = scheme === 'dark' ? colors.dark : colors.light;
  const explore = AGENTS.filter((a) => !a.active);
  const s = createStyles(c);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: c.bg }]}>
      <Header />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Explore Agents</Text>
        <Text style={s.sub}>
          Specialists ready to work for you. Activate any agent and it starts
          immediately.
        </Text>

        <View style={s.grid}>
          {explore.map((agent) => (
            <View key={agent.name} style={s.card}>
              <Text style={s.cardName}>{agent.name}</Text>
              <Text style={s.cardPitch}>{agent.pitch}</Text>
              <TouchableOpacity style={s.activateBtn} activeOpacity={0.7}>
                <Text style={s.activateText}>Activate →</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (c: typeof colors.light) =>
  StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    title: {
      fontSize: 26, fontWeight: '300', color: c.text,
      letterSpacing: -0.5, paddingTop: spacing.lg, marginBottom: spacing.sm,
    },
    sub: {
      fontSize: 14, color: c.textDim, lineHeight: 21, marginBottom: spacing.xl,
    },
    grid: { gap: spacing.md },
    card: {
      borderWidth: 1, borderColor: c.borderLight, borderRadius: 16,
      padding: spacing.lg,
    },
    cardName: {
      fontSize: 17, fontWeight: '600', color: c.text, marginBottom: spacing.sm,
    },
    cardPitch: {
      fontSize: 14, color: c.textMid, lineHeight: 21, marginBottom: spacing.md,
    },
    activateBtn: {
      borderWidth: 1, borderColor: c.borderLight, borderRadius: 9999,
      paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start',
    },
    activateText: { fontSize: 12, fontWeight: '500', color: c.textDim },
  });
