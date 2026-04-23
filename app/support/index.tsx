import { Stack } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from '@/api/client';
import { getErrorMessage } from '@/api/services';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { showError, showSuccess } from '@/utils/toast';

const MIN_MESSAGE_LENGTH = 10;

export default function SupportScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const successScale = useRef(new Animated.Value(1)).current;

  const handleChange = (field: 'name' | 'email' | 'message', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (submitSuccess) {
      setSubmitSuccess(false);
      successScale.setValue(1);
    }

    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleCall = async () => {
    const url = 'tel:+256703163074';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }

    showError('Phone calls are not available on this device.');
  };

  const handleEmail = async () => {
    const url = 'mailto:perpetual.ict@gmail.com?subject=GoCart Support';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }

    showError('Email is not available on this device.');
  };

  const handleOpenMap = async () => {
    const url =
      'https://www.google.com/maps/search/?api=1&query=Perpetual+Labs+Kampala+Uganda';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }

    showError('Maps are not available on this device.');
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const animateSuccess = () => {
    successScale.setValue(1);

    Animated.sequence([
      Animated.spring(successScale, {
        toValue: 1.06,
        useNativeDriver: true,
        friction: 5,
        tension: 120,
      }),
      Animated.spring(successScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 120,
      }),
    ]).start();
  };

  const validateForm = () => {
    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const message = formData.message.trim();

    if (!name) {
      showError('Please enter your name.');
      return false;
    }

    if (!email) {
      showError('Please enter your email address.');
      return false;
    }

    if (!isValidEmail(email)) {
      showError('Please enter a valid email address.');
      return false;
    }

    if (!message) {
      showError('Please enter your message.');
      return false;
    }

    if (message.length < MIN_MESSAGE_LENGTH) {
      showError(`Message must be at least ${MIN_MESSAGE_LENGTH} characters.`);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const message = formData.message.trim();

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setSubmitSuccess(false);
      setSubmitError(null);

      await api.post('/contact/', { name, email, message });

      setFormData({
        name: '',
        email: '',
        message: '',
      });

      setSubmitSuccess(true);
      animateSuccess();
      showSuccess('Your message has been sent successfully.');
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to send message.');
      setSubmitSuccess(false);
      setSubmitError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Help & Support' }} />

      <Screen scroll contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Help & Support</Text>
          <Text style={styles.heroSubtitle}>
            Get in touch with our team to discuss how we can help you with GoCart.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.leftColumn}>
            <Text style={styles.sectionTitle}>Get in Touch</Text>
            <Text style={styles.sectionText}>
              Fill out the form below and we&apos;ll get back to you as soon as possible.
            </Text>

            <View style={styles.infoList}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>Kampala, Uganda</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>+256 (703) 163-074</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>perpetual.ict@gmail.com</Text>
              </View>
            </View>

            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1200&auto=format&fit=crop',
              }}
              style={styles.image}
              resizeMode="cover"
            />

            <View style={styles.quickActions}>
              <Pressable style={styles.secondaryButton} onPress={handleCall}>
                <Text style={styles.secondaryButtonText}>Call Us</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={handleEmail}>
                <Text style={styles.secondaryButtonText}>Email Us</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={handleOpenMap}>
                <Text style={styles.secondaryButtonText}>Open Map</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Send us a message</Text>
            <Text style={styles.formSubtitle}>
              We&apos;ll respond to your inquiry as soon as possible.
            </Text>

            <TextInput
              placeholder="Your Name"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
              editable={!submitting}
            />

            <TextInput
              placeholder="Your Email"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              editable={!submitting}
            />

            <TextInput
              placeholder={`Your Message (min ${MIN_MESSAGE_LENGTH} characters)`}
              placeholderTextColor={colors.muted}
              multiline
              textAlignVertical="top"
              style={styles.textArea}
              value={formData.message}
              onChangeText={(value) => handleChange('message', value)}
              editable={!submitting}
            />

            {submitError ? (
              <Text style={styles.errorText}>{submitError}</Text>
            ) : null}

            <Animated.View style={{ transform: [{ scale: successScale }] }}>
              <Pressable
                style={[
                  styles.primaryButton,
                  submitting && styles.primaryButtonDisabled,
                  submitSuccess && styles.primaryButtonSuccess,
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <View style={styles.buttonContent}>
                  {submitting ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.primaryButtonText}>Sending...</Text>
                    </>
                  ) : submitSuccess ? (
                    <Text style={styles.primaryButtonText}>âœ“ Sent Successfully</Text>
                  ) : (
                    <Text style={styles.primaryButtonText}>Send Message</Text>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          </View>
        </View>

        <View style={styles.locationSection}>
          <Text style={styles.locationTitle}>Our Location</Text>
          <Text style={styles.locationText}>
            Visit us at our office or get in touch online.
          </Text>

          <Pressable style={styles.mapCard} onPress={handleOpenMap}>
            <Text style={styles.mapCardTitle}>Perpetual Labs</Text>
            <Text style={styles.mapCardText}>Kampala, Uganda</Text>
            <Text style={styles.mapCardLink}>Tap to open in Google Maps</Text>
          </Pressable>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl * 2,
    backgroundColor: colors.background,
  },

  hero: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl * 1.4,
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    maxWidth: 520,
  },

  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  leftColumn: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
  },

  infoList: {
    gap: spacing.sm,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border ?? '#E5E7EB',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },

  image: {
    width: '100%',
    height: 200,
    borderRadius: 18,
    marginTop: spacing.sm,
  },

  quickActions: {
    gap: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border ?? '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },

  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border ?? '#E5E7EB',
    gap: spacing.sm,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  formSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border ?? '#E5E7EB',
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.text,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border ?? '#E5E7EB',
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 130,
    fontSize: 14,
    color: colors.text,
  },
  primaryButton: {
    marginTop: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.8,
  },
  primaryButtonSuccess: {
    backgroundColor: '#16A34A',
  },
  buttonContent: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },

  locationSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  locationTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  locationText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  mapCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border ?? '#E5E7EB',
    alignItems: 'center',
  },
  mapCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  mapCardText: {
    marginTop: 6,
    fontSize: 14,
    color: colors.muted,
  },
  mapCardLink: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
