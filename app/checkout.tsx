import React, { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { AuthGate } from '@/components/AuthGate';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';
import type {
  CustomerAddress,
  CustomerAddressPayload,
  CustomerAddressRegion,
} from '@/types';
import { money } from '@/utils/format';

const REGION_OPTIONS: ReadonlyArray<{
  label: string;
  value: CustomerAddressRegion;
}> = [
  { label: 'Kampala Area', value: 'kampala_area' },
  { label: 'Entebbe Area', value: 'entebbe_area' },
  { label: 'Central Region', value: 'central_region' },
  { label: 'Eastern Region', value: 'eastern_region' },
  { label: 'Northern Region', value: 'northern_region' },
  { label: 'Western Region', value: 'western_region' },
  { label: 'Rest of Kampala', value: 'rest_of_kampala' },
];

type AddressFormValues = {
  street_name: string;
  city: string;
  phone_number: string;
  additional_telephone: string;
  additional_information: string;
  region: CustomerAddressRegion;
  is_default: boolean;
};

const EMPTY_FORM: AddressFormValues = {
  street_name: '',
  city: '',
  phone_number: '',
  additional_telephone: '',
  additional_information: '',
  region: 'kampala_area',
  is_default: false,
};

const showSuccess = (message: string) => {
  Toast.show({
    type: 'success',
    text1: 'Success',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
  });
};

const showError = (message: string) => {
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
    position: 'top',
    visibilityTime: 4000,
  });
};

const showInfo = (message: string) => {
  Toast.show({
    type: 'info',
    text1: 'Info',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
  });
};

function AddressFormModal({
  visible,
  loading,
  initialValues,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  loading: boolean;
  initialValues: AddressFormValues;
  onClose: () => void;
  onSubmit: (values: CustomerAddressPayload) => void;
}) {
  const [form, setForm] = useState<AddressFormValues>(initialValues);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  const setField = <K extends keyof AddressFormValues>(
    key: K,
    value: AddressFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = () => {
    const streetName = form.street_name.trim();
    const city = form.city.trim();
    const phoneNumber = form.phone_number.trim();
    const additionalTelephone = form.additional_telephone.trim();
    const additionalInformation = form.additional_information.trim();

    if (!streetName) {
      showInfo('Street name / building / apartment is required.');
      return;
    }

    if (!city) {
      showInfo('City is required.');
      return;
    }

    if (
      phoneNumber &&
      additionalTelephone &&
      phoneNumber === additionalTelephone
    ) {
      showError('Additional telephone must be different from phone number.');
      return;
    }

    onSubmit({
      street_name: streetName,
      city,
      phone_number: phoneNumber,
      additional_telephone: additionalTelephone,
      additional_information: additionalInformation,
      region: form.region,
      is_default: form.is_default,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Add delivery address</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.form}
          >
            <TextInput
              placeholder="Street Name / Building Number / Apartment"
              placeholderTextColor={colors.muted}
              value={form.street_name}
              onChangeText={(v) => setField('street_name', v)}
              style={styles.input}
            />

            <TextInput
              placeholder="City"
              placeholderTextColor={colors.muted}
              value={form.city}
              onChangeText={(v) => setField('city', v)}
              style={styles.input}
            />

            <TextInput
              placeholder="Phone number"
              placeholderTextColor={colors.muted}
              value={form.phone_number}
              onChangeText={(v) => setField('phone_number', v)}
              style={styles.input}
              keyboardType="phone-pad"
            />

            <TextInput
              placeholder="Additional telephone"
              placeholderTextColor={colors.muted}
              value={form.additional_telephone}
              onChangeText={(v) => setField('additional_telephone', v)}
              style={styles.input}
              keyboardType="phone-pad"
            />

            <TextInput
              placeholder="Additional information"
              placeholderTextColor={colors.muted}
              value={form.additional_information}
              onChangeText={(v) => setField('additional_information', v)}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.regionSection}>
              <Text style={styles.sectionLabel}>Region</Text>
              <View style={styles.regionOptions}>
                {REGION_OPTIONS.map((option) => {
                  const selected = form.region === option.value;

                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setField('region', option.value)}
                      style={[
                        styles.regionChip,
                        selected && styles.regionChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.regionChipText,
                          selected && styles.regionChipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Set as default</Text>
              <Switch
                value={form.is_default}
                onValueChange={(v) => setField('is_default', v)}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable
              onPress={onClose}
              style={[styles.actionBtn, styles.cancelBtn]}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={submit}
              style={[
                styles.actionBtn,
                styles.saveBtn,
                loading && styles.buttonDisabled,
              ]}
              disabled={loading}
            >
              <Text style={styles.saveBtnText}>
                {loading ? 'Saving...' : 'Save address'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function AddressOption({
  item,
  selected,
  onSelect,
}: {
  item: CustomerAddress;
  selected: boolean;
  onSelect: () => void;
}) {
  const regionLabel =
    REGION_OPTIONS.find((option) => option.value === item.region)?.label ??
    item.region;

  return (
    <Pressable
      onPress={onSelect}
      style={[
        styles.addressCard,
        selected && styles.addressCardSelected,
      ]}
    >
      <View style={styles.addressHeader}>
        <Text style={styles.addressTitle}>{item.city}</Text>

        <View style={styles.addressBadges}>
          {item.is_default ? (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          ) : null}

          {selected ? (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>Selected</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Text style={styles.cardText}>{item.street_name}</Text>
      <Text style={styles.cardText}>{regionLabel}</Text>

      {!!item.phone_number && (
        <Text style={styles.cardText}>Phone: {item.phone_number}</Text>
      )}

      {!!item.additional_telephone && (
        <Text style={styles.cardText}>Alt: {item.additional_telephone}</Text>
      )}

      {!!item.additional_information && (
        <Text style={styles.cardText}>{item.additional_information}</Text>
      )}
    </Pressable>
  );
}

export default function CheckoutScreen() {
  const {
    cartItems,
    addresses,
    loadAuthedData,
    addAddress,
    updateAddress,
    checkout,
  } = useShop();

  const [loading, setLoading] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  useEffect(() => {
    loadAuthedData().catch(() => undefined);
  }, [loadAuthedData]);

  useEffect(() => {
    if (!addresses.length) {
      setSelectedAddressId(null);
      return;
    }

    const stillExists = addresses.some((item) => item.id === selectedAddressId);
    if (stillExists) return;

    const defaultAddress = addresses.find((item) => item.is_default);
    setSelectedAddressId(defaultAddress?.id ?? addresses[0].id);
  }, [addresses, selectedAddressId]);

  const total = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) =>
          sum +
          Number(item.line_total ?? Number(item.variant?.price || 0) * item.quantity),
        0
      ),
    [cartItems]
  );

  const selectedAddress = useMemo(
    () => addresses.find((item) => item.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId]
  );

  const openAddAddress = () => {
    setAddressModalVisible(true);
  };

  const closeAddAddress = () => {
    setAddressModalVisible(false);
  };

  const submitNewAddress = async (values: CustomerAddressPayload) => {
    try {
      setSavingAddress(true);
      const created = await addAddress(values);

      if (!created) return;

      const nextId =
        typeof created === 'object' && created !== null && 'id' in created
          ? Number(created.id)
          : null;

      if (nextId) {
        setSelectedAddressId(nextId);
      } else {
        const defaultAddress = values.is_default
          ? addresses.find((item) => item.is_default)
          : null;
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      }

      closeAddAddress();
      showSuccess('Address saved successfully.');
    } catch (error: any) {
      showError(
        error?.response?.data?.detail ||
          error?.message ||
          'Failed to save address. Please try again.'
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const onSelectAddress = async (item: CustomerAddress) => {
    setSelectedAddressId(item.id);
  };

  const onMakeDefaultAddress = async () => {
    if (!selectedAddress) return;

    try {
      await updateAddress(selectedAddress.id, { is_default: true });
      showSuccess('Default address updated successfully.');
    } catch (error: any) {
      showError(
        error?.response?.data?.detail ||
          error?.message ||
          'Failed to update address. Please try again.'
      );
    }
  };

  const onPlaceOrder = async () => {
    if (!cartItems.length) {
      showInfo('Add items before checking out.');
      return;
    }

    if (!selectedAddressId) {
      showInfo('Please select or add a delivery address before placing your order.');
      return;
    }

    setLoading(true);
    try {
      const order = await checkout({ address_id: selectedAddressId });

      showSuccess(`Order ${order.slug} placed successfully.`);

      setTimeout(() => {
        router.replace('/(tabs)/orders');
      }, 700);
    } catch (error: any) {
      showError(
        error?.response?.data?.detail ||
          error?.message ||
          'Checkout failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentContainerStyle={{ paddingTop: 0 }}>
      <AuthGate message="Please log in before placing an order.">
        <View style={styles.container}>
          {cartItems.length ? (
            <View style={styles.topRow}>
              <Text style={styles.countPill}>
                {cartItems.length} item{cartItems.length === 1 ? '' : 's'}
              </Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.title}>Delivery address</Text>
              <Pressable onPress={openAddAddress} style={styles.linkBtn}>
                <Text style={styles.linkBtnText}>+ Add new</Text>
              </Pressable>
            </View>

            {!addresses.length ? (
              <EmptyState
                title="No address yet"
                subtitle="Add a delivery address to continue with checkout."
              />
            ) : (
              <View style={styles.addressList}>
                {addresses.map((item) => (
                  <AddressOption
                    key={item.id}
                    item={item}
                    selected={item.id === selectedAddressId}
                    onSelect={() => onSelectAddress(item)}
                  />
                ))}

                {!!selectedAddress && !selectedAddress.is_default && (
                  <Pressable
                    onPress={onMakeDefaultAddress}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>
                      Make selected address default
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Order summary</Text>

            <View style={styles.divider} />

            {cartItems.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.itemInfo}>
                  <Text numberOfLines={2} style={styles.itemText}>
                    {item.product.title}
                  </Text>

                  <Text style={styles.itemMeta}>
                    Qty {item.quantity}
                    {item.variant?.name ? ` • ${item.variant.name}` : ''}
                  </Text>
                </View>

                <Text style={styles.price}>
                  {money(
                    item.line_total ??
                      Number(item.variant?.price || 0) * item.quantity
                  )}
                </Text>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{money(total)}</Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.button,
              (!cartItems.length || !selectedAddressId || loading) &&
                styles.buttonDisabled,
            ]}
            onPress={onPlaceOrder}
            disabled={loading || !cartItems.length || !selectedAddressId}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Placing order...' : 'Place order'}
            </Text>
          </Pressable>
        </View>

        <AddressFormModal
          visible={addressModalVisible}
          loading={savingAddress}
          initialValues={EMPTY_FORM}
          onClose={closeAddAddress}
          onSubmit={submitNewAddress}
        />
      </AuthGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  countPill: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },

  linkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  linkBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  addressList: {
    gap: spacing.sm,
  },

  addressCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.md,
    gap: 6,
  },

  addressCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },

  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },

  addressTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },

  addressBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },

  defaultBadge: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  defaultBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },

  selectedBadge: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  selectedBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '800',
  },

  cardText: {
    fontSize: 14,
    color: colors.text,
  },

  secondaryButton: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  secondaryButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
  },

  itemInfo: {
    flex: 1,
    gap: 4,
  },

  itemText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },

  itemMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },

  price: {
    fontWeight: '800',
    color: colors.text,
    fontSize: 14,
  },

  totalRow: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },

  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
  },

  button: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'flex-end',
  },

  modalCard: {
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    gap: spacing.md,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },

  form: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },

  textArea: {
    minHeight: 96,
  },

  regionSection: {
    gap: spacing.xs,
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },

  regionOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  regionChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },

  regionChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },

  regionChipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },

  regionChipTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },

  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },

  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cancelBtnText: {
    color: colors.text,
    fontWeight: '700',
  },

  saveBtn: {
    backgroundColor: colors.primary,
  },

  saveBtnText: {
    color: colors.surface,
    fontWeight: '800',
  },
});