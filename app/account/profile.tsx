import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Stack } from 'expo-router';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/providers/AuthProvider';
import { authApi } from '@/api/services';
import { colors, spacing } from '@/constants/theme';

type SelectedImage = {
  uri: string;
  name: string;
  type: string;
};

export default function ProfileScreen() {
  const { user, refreshMe } = useAuth();

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setUsername(user.username || '');
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
  }, [user]);

  const avatarSource = useMemo(() => {
    if (selectedImage?.uri) return { uri: selectedImage.uri };
    if (user?.avatar_url) return { uri: user.avatar_url };
    return null;
  }, [selectedImage, user?.avatar_url]);

  const hasChanges = useMemo(() => {
    if (!user) return false;

    return (
      username !== (user.username || '') ||
      firstName !== (user.first_name || '') ||
      lastName !== (user.last_name || '') ||
      !!selectedImage
    );
  }, [user, username, firstName, lastName, selectedImage]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your gallery.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];

    setSelectedImage({
      uri: asset.uri,
      name: asset.fileName || `avatar-${Date.now()}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    });
  };

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Validation', 'Username is required.');
      return;
    }

    try {
      setSaving(true);

      if (selectedImage) {
        const formData = new FormData();

        formData.append('username', username.trim());
        formData.append('first_name', firstName.trim());
        formData.append('last_name', lastName.trim());

        const filename =
          selectedImage.name && selectedImage.name.includes('.')
            ? selectedImage.name
            : `avatar-${Date.now()}.jpg`;

        const fileType = selectedImage.type || 'image/jpeg';

        const uploadUri = selectedImage.uri.startsWith('file://')
          ? selectedImage.uri
          : `file://${selectedImage.uri}`;

        console.log('UPLOAD URI:', uploadUri);
        console.log('UPLOAD NAME:', filename);
        console.log('UPLOAD TYPE:', fileType);

        formData.append('avatar', {
          uri: uploadUri,
          name: filename,
          type: fileType,
        } as any);

        await authApi.updateProfile(formData);
      } else {
        await authApi.updateProfileJson({
          username: username.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        });
      }

      await refreshMe();
      setSelectedImage(null);

      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error: any) {
      console.log('PROFILE UPDATE ERROR MESSAGE:', error?.message);
      console.log('PROFILE UPDATE ERROR RESPONSE:', error?.response?.data);
      console.log('PROFILE UPDATE ERROR STATUS:', error?.response?.status);

      Alert.alert(
        'Update failed',
        typeof error?.response?.data === 'string'
          ? error.response.data
          : JSON.stringify(
              error?.response?.data || error?.message || 'Something went wrong'
            )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Profile Information' }} />

      <Screen scroll contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.avatarSection}>
            <Pressable onPress={pickImage} style={styles.avatarPill}>
              {avatarSource ? (
                <Image source={avatarSource} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </Pressable>

            <View style={styles.avatarTextWrap}>
              <Text style={styles.avatarTitle}>Profile Photo</Text>
              <Text style={styles.avatarSubtitle}>
                Tap the image to upload a new profile picture.
              </Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor={colors.muted}
              style={styles.input}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.readonlyRow}>
            <Text style={styles.readonlyLabel}>Email</Text>
            <Text style={styles.readonlyValue}>{user?.email || '-'}</Text>
          </View>

          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.readonlyLabel}>User Type</Text>
              <Text style={styles.readonlyValue}>{user?.user_type || '-'}</Text>
            </View>

            <View style={styles.alignRight}>
              <Text style={styles.readonlyLabel}>Email Verification</Text>

              <View
                style={[
                  styles.badge,
                  user?.is_email_verified
                    ? styles.badgeSuccess
                    : styles.badgeDanger,
                ]}
              >
                <Text style={styles.badgeText}>
                  {user?.is_email_verified ? 'Verified' : 'Not Verified'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={!hasChanges || saving}
          style={[
            styles.saveButton,
            (!hasChanges || saving) && styles.saveButtonDisabled,
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </Pressable>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
  },

  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },

  avatarPill: {
    width: 84,
    height: 84,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },

  avatarFallbackText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },

  avatarTextWrap: {
    flex: 1,
  },

  avatarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  avatarSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  field: {
    gap: 6,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 14,
  },

  readonlyRow: {
    gap: 4,
    paddingVertical: 4,
  },

  readonlyLabel: {
    fontSize: 12,
    color: colors.muted,
  },

  readonlyValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },

  saveButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary ?? colors.text,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  alignRight: {
    alignItems: 'flex-end',
  },

  badge: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  badgeSuccess: {
    backgroundColor: '#DCFCE7',
  },

  badgeDanger: {
    backgroundColor: '#FEE2E2',
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
});