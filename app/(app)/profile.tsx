import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useColors } from '@/hooks/use-colors';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    signOut();
    router.replace('/(auth)/login');
  };

  const styles = useMemo(() => createProfileStyles(colors), [colors]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <ThemedView style={styles.profileHeader}>
        <ThemedView style={styles.avatar}>
          <ThemedText style={styles.avatarText}>
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </ThemedText>
        </ThemedView>
        <ThemedText type="title" style={styles.username}>
          {user?.username || 'User'}
        </ThemedText>
        <ThemedText type="default" style={styles.email}>
          {user?.username}@pineai.system
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Account Information
        </ThemedText>
        <ThemedView style={styles.infoRow}>
          <ThemedText>Username:</ThemedText>
          <ThemedText type="defaultSemiBold">{user?.username}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.infoRow}>
          <ThemedText>Account Status:</ThemedText>
          <ThemedText type="defaultSemiBold" style={{ color: 'green' }}>
            Active
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.infoRow}>
          <ThemedText>Member Since:</ThemedText>
          <ThemedText type="defaultSemiBold">Jan 2024</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Settings
        </ThemedText>
        <TouchableOpacity style={styles.settingRow}>
          <ThemedText>Notifications</ThemedText>
          <ThemedText>Enabled</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingRow}>
          <ThemedText>Two-Factor Authentication</ThemedText>
          <ThemedText>Disabled</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.primary }]}
        onPress={handleLogout}
      >
        <ThemedText type="defaultSemiBold" style={styles.logoutButtonText}>
          Sign Out
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const createProfileStyles = (colors: typeof Colors) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
  },
  username: {
    marginBottom: 4,
    textAlign: 'center',
  },
  email: {
    opacity: 0.7,
    fontSize: 14,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  logoutButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#fff',
  },
});
