import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { Button, Input } from '@/components/ui';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useColors } from '@/hooks/use-colors';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const colors = useColors();
  const { signIn, checkAccountExists } = useAuth();
  const router = useRouter();

  // Load remembered username
  useEffect(() => {
    loadRememberedUser();
  }, []);

  const loadRememberedUser = async () => {
    try {
      const remembered = await AsyncStorage.getItem('rememberedUser');
      if (remembered) {
        setUsername(remembered);
        setRememberMe(true);
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const accountExists = await checkAccountExists(username);
      if (!accountExists) {
        Alert.alert(
          'Account Not Found',
          `No account found with username "${username}". Would you like to create a new account?`,
          [
            {
              text: 'Sign Up',
              onPress: () => {
                setLoading(false);
                router.push('/(auth)/signup');
              },
              style: 'default',
            },
            {
              text: 'Try Again',
              onPress: () => setLoading(false),
              style: 'cancel',
            },
          ]
        );
        return;
      }

      // Save or remove remembered user
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedUser', username);
      } else {
        await AsyncStorage.removeItem('rememberedUser');
      }

      await signIn(username, password);
      router.replace('/(app)/home');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  const styles = useMemo(() => createLoginStyles(colors), [colors]);

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 40}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          
          {/* Logo Section */}
          <View style={styles.logoSection}>
            {/* Logo Circle */}
            <View style={[styles.logoCircle, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}>
              <MaterialIcons name="grass" size={56} color={colors.primary} />
            </View>
            <Text style={[styles.appName, { color: colors.primary }]}>PineAI</Text>
            <Text style={[styles.tagline, { color: colors.textMuted }]}>Pineapple Classification System</Text>
          </View>

          <View style={styles.formSection}>
            <Input
              label="Username"
              icon="person"
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <Input
              label="Password"
              icon="lock"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showPasswordToggle
              autoCapitalize="none"
              editable={!loading}
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxChecked,
                  ]}
                >
                  {rememberMe && (
                    <MaterialIcons name="check" size={14} color={Colors.textInverse} />
                  )}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Login"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.footerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createLoginStyles = (colors: typeof Colors) => StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: Spacing.md,
  },
  appName: {
    ...Typography.h2,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  headerSection: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  formSection: {
    gap: Spacing.sm,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -Spacing.xs,
    marginBottom: Spacing.md,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderFocus,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rememberText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xxxxl,
  },
  footerText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
});
