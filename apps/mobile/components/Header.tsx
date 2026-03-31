import { View, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { colors, spacing } from '../constants/theme';

export default function Header() {
  const scheme = useColorScheme();
  const c = scheme === 'dark' ? colors.dark : colors.light;
  const nav = useNavigation();

  return (
    <View style={s.header}>
      <View />
      <TouchableOpacity
        style={s.hamburger}
        onPress={() => nav.dispatch(DrawerActions.toggleDrawer())}
        hitSlop={12}
      >
        <View style={[s.bar, { backgroundColor: c.text }]} />
        <View style={[s.bar, s.barShort, { backgroundColor: c.text }]} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: 0,
  },
  hamburger: {
    width: 18,
    height: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bar: {
    width: 18,
    height: 1.5,
    borderRadius: 1,
  },
  barShort: {
    width: 12,
  },
});
