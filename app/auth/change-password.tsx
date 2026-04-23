import React, { useState } from 'react';
import { Stack } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/constants/theme';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon: keyof typeof Feather.glyphMap;
  secure: boolean;
  onToggleSecure: () => void;
  editable?: boolean;
};

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secure,
  onToggleSecure,
  editable = true,
}: PasswordFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrapper}>
        <Feather name={icon} size={18} color={colors.muted} />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={secure}
          editable={editable}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <Pressable
          onPress={onToggleSecure}
          hitSlop={10}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Feather
            name={secure ? 'eye' : 'eye-off'}
            size={18}
            color={colors.muted}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const { changePassword, loading } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async () => {
    try {
      if (
        !currentPassword.trim() ||
        !newPassword.trim() ||
        !confirmPassword.trim()
      ) {
        Alert.alert('Missing details', 'Please complete all fields.');
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert('Password mismatch', 'New passwords do not match.');
        return;
      }

      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      });

      Alert.alert('Success', 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const data = error?.response?.data;
      const message =
        data?.detail ||
        data?.current_password?.[0] ||
        data?.new_password?.[0] ||
        data?.new_password_confirm?.[0] ||
        'Could not change password.';

      Alert.alert('Error', message);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Change Password',
        }}
      />

      <Screen scroll contentContainerStyle={styles.page}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              <View style={styles.content}>
                <View style={styles.header}>
                  <Text style={styles.title}>Change password</Text>
                  <Text style={styles.subtitle}>
                    Update your password to keep your account secure.
                  </Text>
                </View>

                <View style={styles.card}>
                  <View style={styles.form}>
                    <PasswordField
                      label="Current password"
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Enter current password"
                      icon="lock"
                      secure={!showCurrentPassword}
                      onToggleSecure={() =>
                        setShowCurrentPassword((prev) => !prev)
                      }
                      editable={!loading}
                    />

                    <PasswordField
                      label="New password"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new password"
                      icon="shield"
                      secure={!showNewPassword}
                      onToggleSecure={() => setShowNewPassword((prev) => !prev)}
                      editable={!loading}
                    />

                    <PasswordField
                      label="Confirm new password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm new password"
                      icon="check-circle"
                      secure={!showConfirmPassword}
                      onToggleSecure={() =>
                        setShowConfirmPassword((prev) => !prev)
                      }
                      editable={!loading}
                    />

                    <Pressable
                      onPress={onSubmit}
                      disabled={loading}
                      style={({ pressed }) => [
                        styles.button,
                        pressed && !loading && styles.buttonPressed,
                        loading && styles.buttonDisabled,
                      ]}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Change password</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  page: {
    backgroundColor: colors.background,
    paddingBottom: spacing.lg,
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
  },

  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: spacing.lg,
  },

  header: {
    gap: 6,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 340,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  form: {
    gap: spacing.md,
  },

  field: {
    gap: 8,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },

  inputWrapper: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 14,
  },

  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  button: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },

  buttonPressed: {
    opacity: 0.92,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },

  pressed: {
    opacity: 0.75,
  },
});