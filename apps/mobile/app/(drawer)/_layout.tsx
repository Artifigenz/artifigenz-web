import { Drawer } from 'expo-router/drawer';
import { useColorScheme, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { colors, spacing } from '../../constants/theme';

function DrawerContent(props: DrawerContentComponentProps) {
  const scheme = useColorScheme();
  const c = scheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();
  const s = createDrawerStyles(c);

  const navigate = (route: string) => {
    props.navigation.closeDrawer();
    router.push(route as never);
  };

  return (
    <View style={[s.container, { backgroundColor: c.bg }]}>
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>S</Text>
        </View>
        <Text style={s.name}>Suba</Text>
        <Text style={s.email}>suba@artifigenz.com</Text>
      </View>

      <View style={s.divider} />

      <TouchableOpacity style={s.item} onPress={() => navigate('/')}>
        <Text style={s.itemIcon}>⌂</Text>
        <Text style={s.itemLabel}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.item} onPress={() => navigate('/explore')}>
        <Text style={s.itemIcon}>◎</Text>
        <Text style={s.itemLabel}>Explore Agents</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.item} onPress={() => navigate('/settings')}>
        <Text style={s.itemIcon}>⚙</Text>
        <Text style={s.itemLabel}>Settings</Text>
      </TouchableOpacity>

      <View style={s.divider} />

      <View style={s.footer}>
        <Text style={s.footerText}>Artifigenz v0.1.0</Text>
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  const scheme = useColorScheme();
  const c = scheme === 'dark' ? colors.dark : colors.light;

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        drawerPosition: 'right',
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
          backgroundColor: c.bg,
        },
        overlayColor: 'rgba(0,0,0,0.4)',
        swipeEdgeWidth: 50,
      }}
    >
      <Drawer.Screen name="index" />
      <Drawer.Screen name="explore" />
      <Drawer.Screen name="settings" />
    </Drawer>
  );
}

const createDrawerStyles = (c: typeof colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 60,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.text,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    avatarText: {
      color: c.bg,
      fontSize: 18,
      fontWeight: '600',
    },
    name: {
      fontSize: 17,
      fontWeight: '600',
      color: c.text,
      marginBottom: 2,
    },
    email: {
      fontSize: 13,
      color: c.textDim,
    },
    divider: {
      height: 1,
      backgroundColor: c.borderLight,
      marginVertical: spacing.sm,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
    },
    itemIcon: {
      fontSize: 18,
      color: c.textDim,
      width: 24,
      textAlign: 'center',
    },
    itemLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: c.text,
    },
    footer: {
      marginTop: 'auto',
      padding: spacing.lg,
    },
    footerText: {
      fontSize: 12,
      color: c.textDim,
    },
  });
