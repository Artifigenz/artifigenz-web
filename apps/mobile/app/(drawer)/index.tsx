import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AGENTS } from '@artifigenz/shared';
import { colors, spacing } from '../../constants/theme';
import Header from '../../components/Header';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

const QUICK_AGENTS = ['Finance', 'Travel', 'Research'];

export default function HomeScreen() {
  const scheme = useColorScheme();
  const c = scheme === 'dark' ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const active = AGENTS.filter((a) => a.active);
  const [greeting] = useState(getGreeting);
  const [ticks, setTicks] = useState<number[]>(active.map(() => 0));
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const s = createStyles(c);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      setTicks((prev) => {
        const next = [...prev];
        next[current] = prev[current] + 1;
        return next;
      });
      current = (current + 1) % active.length;
    }, 4000);
    return () => clearInterval(interval);
  }, [active.length]);

  return (
    <View style={[s.safe, { backgroundColor: c.bg, paddingTop: insets.top - 6 }]}>
      <Header />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.flex}
        keyboardVerticalOffset={0}
      >
        <View style={s.flex}>
          {/* Scrollable content */}
          <View style={s.flex}>
            <ScrollView
              style={s.flex}
              contentContainerStyle={s.scroll}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={s.greeting}>
                {greeting}, Suba — your agents found a few things while you were away.
              </Text>

              {active.map((agent, index) => {
                const insight = agent.insights?.[ticks[index] % (agent.insights?.length || 1)];
                return (
                  <TouchableOpacity key={agent.name} style={s.card} activeOpacity={0.7}>
                    <View style={s.cardHeader}>
                      <Text style={s.cardName}>{agent.name}</Text>
                      <View style={s.dot} />
                      <Text style={s.cardTime}>{agent.lastActive}</Text>
                    </View>
                    {insight && <Text style={s.cardInsight}>{insight}</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Fade overlay at the bottom of the scroll area */}
            <LinearGradient
              colors={[c.bg + '00', c.bg]}
              style={s.fadeGradient}
              pointerEvents="none"
            />
          </View>

          {/* Chat input flush to bottom */}
          <View style={[s.chatBar, { paddingBottom: Math.max(insets.bottom - 26, 2) }]}>
            <View style={s.chatBox}>
              <TextInput
                style={s.chatInput}
                placeholder={
                  selectedAgent
                    ? `Ask ${selectedAgent} agent...`
                    : 'Ask anything or give a task...'
                }
                placeholderTextColor={c.textDim}
                multiline
              />
              <View style={s.chatToolbar}>
                <View style={s.chipRow}>
                  <TouchableOpacity style={s.addBtn}>
                    <Text style={s.addIcon}>+</Text>
                  </TouchableOpacity>
                  {QUICK_AGENTS.map((name) => (
                    <TouchableOpacity
                      key={name}
                      style={[s.chip, selectedAgent === name && s.chipActive]}
                      onPress={() =>
                        setSelectedAgent(selectedAgent === name ? null : name)
                      }
                    >
                      <Text
                        style={[s.chipText, selectedAgent === name && s.chipTextActive]}
                      >
                        {name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={s.sendBtn}>
                  <Text style={s.sendIcon}>→</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (c: typeof colors.light) =>
  StyleSheet.create({
    safe: { flex: 1 },
    flex: { flex: 1 },
    scroll: {
      padding: spacing.lg,
      paddingBottom: 60,
    },
    greeting: {
      fontSize: 26,
      fontWeight: '300',
      color: c.text,
      lineHeight: 33,
      letterSpacing: -0.5,
      paddingTop: 4,
      paddingBottom: spacing.md,
    },
    card: {
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.borderLight,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    cardName: { fontSize: 15, fontWeight: '600', color: c.text },
    dot: {
      width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e',
    },
    cardTime: { fontSize: 11, color: c.textDim },
    cardInsight: { fontSize: 14, color: c.textMid, lineHeight: 21 },
    fadeGradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 48,
    },
    chatBar: {
      paddingHorizontal: spacing.md,
      paddingTop: 2,
      backgroundColor: c.bg,
    },
    chatBox: {
      borderWidth: 1,
      borderColor: c.borderLight,
      borderRadius: 20,
      padding: spacing.md,
      backgroundColor: c.bg,
    },
    chatInput: {
      fontSize: 15, color: c.text, minHeight: 24, maxHeight: 80,
      marginBottom: spacing.sm,
    },
    chatToolbar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    chipRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    addBtn: {
      width: 28, height: 28, borderRadius: 14,
      borderWidth: 1, borderColor: c.borderLight,
      alignItems: 'center', justifyContent: 'center',
    },
    addIcon: { fontSize: 18, color: c.textDim, marginTop: -1 },
    chip: {
      borderWidth: 1, borderColor: c.borderLight, borderRadius: 9999,
      paddingHorizontal: 12, paddingVertical: 5,
    },
    chipActive: { backgroundColor: c.text, borderColor: c.text },
    chipText: { fontSize: 11, fontWeight: '500', color: c.textDim },
    chipTextActive: { color: c.bg },
    sendBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: c.text,
      alignItems: 'center', justifyContent: 'center',
    },
    sendIcon: { color: c.bg, fontSize: 18, fontWeight: '600' },
  });
