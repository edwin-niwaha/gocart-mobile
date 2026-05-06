import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Stack } from 'expo-router';

import { PageHeader } from '@/components/AppHeader';
import { Screen } from '@/components/Screen';
import { authApi, getErrorMessage } from '@/api/services';
import { colors, radii, shadows, spacing } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';

type SelectedImage = {
  uri: string;
  name: string;
  type: string;
  file?: File;
  size?: number;
};

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

function getExtensionFromMimeType(mimeType: string) {
  const subtype = mimeType.split('/')[1]?.split(';')[0]?.trim();
  if (!subtype) return 'jpg';
  if (subtype === 'jpeg') return 'jpg';
  return subtype.replace(/[^a-z0-9]/gi, '') || 'jpg';
}

function getAvatarFileName(asset: ImagePicker.ImagePickerAsset, mimeType: string) {
  const candidate = asset.fileName?.trim();
  if (candidate && candidate.includes('.')) {
    return candidate;
  }

  return `avatar-${Date.now()}.${getExtensionFromMimeType(mimeType)}`;
}

export default function ProfileScreen() {
  const { user, refreshMe } = useAuth();
  const { width } = useWindowDimensions();
  const stackFields = width < 380;

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
    if (selectedImage?.uri) {
      return { uri: selectedImage.uri };
    }

    if (user?.avatar_url) {
      return { uri: user.avatar_url };
    }

    return null;
  }, [selectedImage, user?.avatar_url]);

  const displayName = useMemo(() => {
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

    if (fullName) return fullName;
    if (username.trim()) return username.trim();

    return 'Your profile';
  }, [firstName, lastName, username]);

  const hasChanges = useMemo(() => {
    if (!user) return false;

    return (
      username !== (user.username || '') ||
      firstName !== (user.first_name || '') ||
      lastName !== (user.last_name || '') ||
      Boolean(selectedImage)
    );
  }, [user, username, firstName, lastName, selectedImage]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType || 'image/jpeg';

    if (!mimeType.startsWith('image/')) {
      Alert.alert('Unsupported file', 'Please choose an image file for your profile photo.');
      return;
    }

    if (asset.fileSize && asset.fileSize > MAX_AVATAR_SIZE_BYTES) {
      Alert.alert('Image too large', 'Please choose an image smaller than 5 MB.');
      return;
    }

    setSelectedImage({
      uri: asset.uri,
      name: getAvatarFileName(asset, mimeType),
      type: mimeType,
      file: asset.file,
      size: asset.fileSize,
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

        if (selectedImage.file) {
          formData.append('avatar', selectedImage.file);
        } else {
          const avatarFile = {
            uri: selectedImage.uri,
            name: filename,
            type: fileType,
          } as unknown as Blob;

          formData.append('avatar', avatarFile);
        }

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
    } catch (error: unknown) {
      Alert.alert('Update failed', getErrorMessage(error, 'Profile update failed.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Profile' }} />

      <Screen scroll contentContainerStyle={styles.container}>
        <PageHeader
          icon="person"
          title="Your Profile"
          subtitle="Keep your photo and personal details up to date"
          tone="primary"
        />

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Pressable onPress={pickImage} style={styles.avatarButton}>
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

            <View style={styles.profileText}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'No email address'}</Text>
              <Text style={styles.profileHint}>
                JPG, PNG, or HEIC up to 5 MB. Square photos look best.
              </Text>

              <Pressable onPress={pickImage} style={styles.secondaryAction}>
                <Text style={styles.secondaryActionText}>Change photo</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal information</Text>
          <Text style={styles.sectionDescription}>
            This name appears on orders, account screens, and support messages.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor={colors.muted}
              style={styles.input}
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inlineFields, stackFields && styles.stackedFields]}>
            <View style={[styles.fieldGroup, styles.flexOne]}>
              <Text style={styles.fieldLabel}>First name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            </View>

            <View style={[styles.fieldGroup, styles.flexOne]}>
              <Text style={styles.fieldLabel}>Last name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account details</Text>
          <Text style={styles.sectionDescription}>
            Email and account status are protected details.
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || '-'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User type</Text>
            <Text style={styles.infoValue}>{user?.user_type || '-'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email verification</Text>
            <View
              style={[
                styles.statusBadge,
                user?.is_email_verified
                  ? styles.statusBadgeSuccess
                  : styles.statusBadgeDanger,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  user?.is_email_verified
                    ? styles.statusBadgeTextSuccess
                    : styles.statusBadgeTextDanger,
                ]}
              >
                {user?.is_email_verified ? 'Verified' : 'Not verified'}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={!hasChanges || saving}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && hasChanges && !saving && styles.pressed,
            (!hasChanges || saving) && styles.primaryButtonDisabled,
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Save changes</Text>
          )}
        </Pressable>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    backgroundColor: colors.background,
  },

  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    ...shadows.soft,
  },

  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    ...shadows.soft,
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  avatarButton: {
    width: 84,
    height: 84,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: 3,
    borderColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
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

  profileText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },

  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    flexShrink: 1,
  },

  profileEmail: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },

  profileHint: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.subtle,
  },

  secondaryAction: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },

  secondaryActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },

  sectionDescription: {
    marginTop: -6,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },

  fieldGroup: {
    gap: 6,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
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

  inlineFields: {
    flexDirection: 'row',
    gap: 10,
  },

  stackedFields: {
    flexDirection: 'column',
  },

  flexOne: {
    flex: 1,
  },

  infoRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  infoLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.muted,
  },

  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusBadgeSuccess: {
    backgroundColor: '#DCFCE7',
  },

  statusBadgeDanger: {
    backgroundColor: '#FEE2E2',
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  statusBadgeTextSuccess: {
    color: '#166534',
  },

  statusBadgeTextDanger: {
    color: '#991B1B',
  },

  primaryButton: {
    minHeight: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary ?? colors.text,
    ...shadows.soft,
  },

  primaryButtonDisabled: {
    opacity: 0.6,
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },

  pressed: {
    opacity: 0.9,
  },
});
