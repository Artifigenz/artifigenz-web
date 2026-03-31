import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: dark ? '#000' : '#fff' },
        }}
      />
    </GestureHandlerRootView>
  );
}
