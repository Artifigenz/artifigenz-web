import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../constants/theme';
import Header from '../../components/Header';

const MODES = ['Light', 'Auto', 'Dark'] as const;

const THEMES = [
  { name: 'Terminal', desc: 'Monospace. Black and white. Raw.' },
  { name: 'Minimal', desc: 'Clean lines. Soft grays. Quiet.' },
  { name: 'Warm', desc: 'Earthy tones. Rounded. Cozy.' },
  { name: 'Ocean', desc: 'Deep blues. Calm. Expansive.' },
];

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const c = scheme === 'dark' ? colors.dark : colors.light;
  const [activeMode, setActiveMode] = useState(1);
  const [activeTheme, setActiveTheme] = useState(0);
  const s = createStyles(c);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: c.bg }]}>
      <Header />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Settings</Text>

        <Text style={s.sectionTitle}>Profile</Text>
        <View style={s.field}>
          <Text style={s.label}>Name</Text>
          <TextInput style={s.input} value="Suba" editable={false} />
        </View>
        <View style={s.field}>
          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} value="suba@artifigenz.com" editable={false} />
        </View>
        <View style={s.divider} />

        <Text style={s.sectionTitle}>Appearance</Text>
        <View style={s.field}>
          <Text style={s.label}>Mode</Text>
          <View style={s.modeRow}>
            {MODES.map((m, i) => (
              <TouchableOpacity
                key={m}
                style={[s.modeBtn, activeMode === i && s.modeBtnActive]}
                onPress={() => setActiveMode(i)}
              >
                <Text style={[s.modeBtnText, activeMode === i && s.modeBtnTextActive]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={s.field}>
          <Text style={s.label}>Theme</Text>
          <View style={s.themeGrid}>
            {THEMES.map((t, i) => (
              <TouchableOpacity
                key={t.name}
                style={[s.themeCard, activeTheme === i && s.themeCardActive]}
                onPress={() => setActiveTheme(i)}
              >
                <Text style={s.themeName}>{t.name}</Text>
                <Text style={s.themeDesc}>{t.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={s.divider} />

        <Text style={s.sectionTitle}>Notifications</Text>
        <View style={s.field}>
          <Text style={s.label}>Agent insights</Text>
          <Text style={s.hint}>Coming soon</Text>
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
      letterSpacing: -0.5, paddingTop: spacing.lg, marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: 15, fontWeight: '600', color: c.text, marginBottom: spacing.md,
    },
    field: { marginBottom: spacing.md },
    label: {
      fontSize: 12, fontWeight: '500', color: c.textDim, marginBottom: spacing.sm,
    },
    input: {
      fontSize: 14, color: c.text, borderWidth: 1, borderColor: c.borderLight,
      borderRadius: 10, padding: 10, paddingHorizontal: 14,
    },
    hint: { fontSize: 13, color: c.textDim },
    divider: {
      height: 1, backgroundColor: c.borderLight, marginVertical: spacing.xl,
    },
    modeRow: { flexDirection: 'row', gap: 6 },
    modeBtn: {
      flex: 1, borderWidth: 1, borderColor: c.borderLight, borderRadius: 10,
      paddingVertical: 10, alignItems: 'center',
    },
    modeBtnActive: { backgroundColor: c.text, borderColor: c.text },
    modeBtnText: { fontSize: 13, fontWeight: '500', color: c.textDim },
    modeBtnTextActive: { color: c.bg },
    themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    themeCard: {
      width: '47%', borderWidth: 1, borderColor: c.borderLight,
      borderRadius: 12, padding: spacing.md,
    },
    themeCardActive: { borderColor: c.text },
    themeName: { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 4 },
    themeDesc: { fontSize: 11, color: c.textDim, lineHeight: 16 },
  });
