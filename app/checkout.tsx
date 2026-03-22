import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { router } from 'expo-router';
import {
  Image,
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
import { paymentApi } from '@/api/services';

type PaymentProvider = 'CASH' | 'MTN' | 'AIRTEL';

const PAYMENT_OPTIONS: ReadonlyArray<{
  label: string;
  subtitle: string;
  value: PaymentProvider;
}> = [
  {
    label: 'Pay on Delivery',
    subtitle: 'Cash or Mobile Money on arrival',
    value: 'CASH',
  },
  {
    label: 'MTN Mobile Money',
    subtitle: 'Pay instantly with MTN MoMo',
    value: 'MTN',
  },
  {
    label: 'Airtel Money',
    subtitle: 'Coming soon',
    value: 'AIRTEL',
  },
];

const PAYMENT_ICONS = {
  MTN: require('@/assets/images/momo/mtn.png'),
  AIRTEL: require('@/assets/images/momo/airtel.png'),
} as const;

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

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const normalizeUgPhone = (value: string) => {
  const raw = value.trim().replace(/[^\d+]/g, '');

  if (!raw) return '';

  if (raw.startsWith('+256')) return raw;
  if (raw.startsWith('256')) return `+${raw}`;
  if (raw.startsWith('0')) return `+256${raw.slice(1)}`;

  return raw;
};

const isValidUgPhone = (value: string) => /^\+2567\d{8}$/.test(value);

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
    const payload: CustomerAddressPayload = {
      street_name: form.street_name.trim(),
      city: form.city.trim(),
      phone_number: form.phone_number.trim(),
      additional_telephone: form.additional_telephone.trim(),
      additional_information: form.additional_information.trim(),
      region: form.region,
      is_default: form.is_default,
    };

    if (!payload.street_name) {
      showInfo('Street name / building / apartment is required.');
      return;
    }

    if (!payload.city) {
      showInfo('City is required.');
      return;
    }

    if (
      payload.phone_number &&
      payload.additional_telephone &&
      payload.phone_number === payload.additional_telephone
    ) {
      showError('Additional telephone must be different from phone number.');
      return;
    }

    onSubmit(payload);
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
              keyboardType="phone-pad"
              style={styles.input}
            />

            <TextInput
              placeholder="Additional telephone"
              placeholderTextColor={colors.muted}
              value={form.additional_telephone}
              onChangeText={(v) => setField('additional_telephone', v)}
              keyboardType="phone-pad"
              style={styles.input}
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
              disabled={loading}
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
  expanded,
  onSelect,
  onToggleExpand,
}: {
  item: CustomerAddress;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}) {
  const regionLabel =
    REGION_OPTIONS.find((option) => option.value === item.region)?.label ??
    item.region;

  return (
    <Pressable
      onPress={onSelect}
      style={[styles.addressCard, selected && styles.addressCardSelected]}
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

          <Pressable
            onPress={onToggleExpand}
            style={styles.expandBtn}
            hitSlop={8}
          >
            <Text style={styles.expandBtnText}>{expanded ? '-' : '+'}</Text>
          </Pressable>
        </View>
      </View>

      {expanded ? (
        <View style={styles.addressDetails}>
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
        </View>
      ) : null}
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
  const [expandedAddressId, setExpandedAddressId] = useState<number | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('CASH');
  const [mtnPhone, setMtnPhone] = useState('');
  const [pollingPayment, setPollingPayment] = useState(false);

  useEffect(() => {
    loadAuthedData().catch(() => undefined);
  }, [loadAuthedData]);

  useEffect(() => {
    if (!addresses.length) {
      setSelectedAddressId(null);
      setExpandedAddressId(null);
      return;
    }

    const selectedExists = addresses.some((item) => item.id === selectedAddressId);
    if (!selectedExists) {
      const defaultAddress = addresses.find((item) => item.is_default);
      const fallbackId = defaultAddress?.id ?? addresses[0]?.id ?? null;
      setSelectedAddressId(fallbackId);
      setExpandedAddressId(fallbackId);
    }

    const expandedExists = addresses.some((item) => item.id === expandedAddressId);
    if (!expandedExists) {
      setExpandedAddressId(null);
    }
  }, [addresses, selectedAddressId, expandedAddressId]);

  useEffect(() => {
    if (paymentProvider !== 'MTN' && mtnPhone) {
      setMtnPhone('');
    }
  }, [paymentProvider, mtnPhone]);

  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const itemTotal =
        item.line_total ?? Number(item.variant?.price || 0) * item.quantity;
      return sum + Number(itemTotal);
    }, 0);
  }, [cartItems]);

  const selectedAddress = useMemo(() => {
    return addresses.find((item) => item.id === selectedAddressId) ?? null;
  }, [addresses, selectedAddressId]);

  const cashOption = PAYMENT_OPTIONS.find((option) => option.value === 'CASH');
  const mobileMoneyOptions = PAYMENT_OPTIONS.filter(
    (option) => option.value === 'MTN' || option.value === 'AIRTEL'
  );

  const isBusy = loading || pollingPayment;
  const isPlaceOrderDisabled =
    !cartItems.length || !selectedAddressId || isBusy;

  const openAddAddress = () => setAddressModalVisible(true);
  const closeAddAddress = () => setAddressModalVisible(false);

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
        setExpandedAddressId(nextId);
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

  const onSelectAddress = (item: CustomerAddress) => {
    setSelectedAddressId(item.id);
  };

  const onToggleAddressExpand = (itemId: number) => {
    setExpandedAddressId((prev) => (prev === itemId ? null : itemId));
  };

  const onMakeDefaultAddress = async () => {
    if (!selectedAddress) return;

    try {
      await updateAddress(selectedAddress.id, { is_default: true });
      showSuccess('Default address updated successfully.');
      await loadAuthedData().catch(() => undefined);
    } catch (error: any) {
      showError(
        error?.response?.data?.detail ||
          error?.message ||
          'Failed to update address. Please try again.'
      );
    }
  };

  const getMtnFailureMessage = (statusRes: any): string => {
    const reason =
      statusRes?.provider_response?.status_check?.reason ||
      statusRes?.reason ||
      '';

    const normalized = String(reason).toUpperCase();

    switch (normalized) {
      case 'LOW_BALANCE_OR_PAYEE_LIMIT_REACHED_OR_NOT_ALLOWED':
        return 'Payment failed. Your MTN line may not have enough balance, transaction limits may be reached, or the account is not allowed for this payment.';

      case 'REJECTED':
        return 'Payment was declined on your phone. Please try again.';

      case 'EXPIRED':
        return 'Payment request expired. Please try again.';

      case 'NOT_ALLOWED':
        return 'This MTN number is not allowed to make this payment.';

      default:
        return 'Payment failed. Please try again or use a different payment method.';
    }
  };

  const pollPaymentStatus = useCallback(async (reference: string) => {
    const maxAttempts = 15;
    const intervalMs = 4000;

    setPollingPayment(true);

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        await delay(intervalMs);

        const statusRes = await paymentApi.checkStatus(reference);
        const paymentStatus = String(statusRes?.status || '').toUpperCase();

        if (paymentStatus === 'PAID') {
          showSuccess('Payment successful.');
          return true;
        }

        if (paymentStatus === 'FAILED') {
          const message = getMtnFailureMessage(statusRes);
          showError(message);
          return false;
        }

        if (paymentStatus === 'CANCELLED') {
          showError('You cancelled the payment on your phone.');
          return false;
        }

        if (attempt === 5 || attempt === 10) {
          showInfo('Still waiting for MTN payment approval...');
        }
      }

      showInfo(
        'Payment is still processing. Please confirm later from your payment status or orders.'
      );
      return false;
    } catch (error: any) {
      showError(
        error?.response?.data?.detail ||
          error?.message ||
          'Could not confirm payment status right now.'
      );
      return false;
    } finally {
      setPollingPayment(false);
    }
  }, []);

  const handleCashCheckout = useCallback(async () => {
    if (!selectedAddressId) {
      showInfo('Please select a delivery address.');
      return;
    }

    const order = await checkout({ address_id: selectedAddressId });

    try {
      await paymentApi.create({
        order: order.id,
        provider: 'CASH',
        amount: total,
        currency: 'UGX',
      });
    } catch (paymentError: any) {
      showError(
        paymentError?.response?.data?.detail ||
          paymentError?.message ||
          'Order placed but payment record could not be saved.'
      );
    }

    showSuccess(`Order ${order.slug} placed successfully.`);
    await loadAuthedData().catch(() => undefined);
    router.replace('/(tabs)/orders');
  }, [checkout, loadAuthedData, selectedAddressId, total]);

  const handleMTNCheckout = useCallback(async () => {
    if (!selectedAddressId) {
      showInfo('Please select a delivery address.');
      return;
    }

    const normalizedPhone = normalizeUgPhone(mtnPhone);

    if (!normalizedPhone) {
      showInfo('Enter your MTN phone number.');
      return;
    }

    if (!isValidUgPhone(normalizedPhone)) {
      showError('Enter a valid Uganda number like 078XXXXXXX or +25678XXXXXXX.');
      return;
    }

    const payment = await paymentApi.initiateMTN({
      address_id: selectedAddressId,
      phone_number: normalizedPhone,
    });

    showInfo('Approve the MTN Mobile Money prompt on your phone.');

    const paid = await pollPaymentStatus(payment.reference);
    if (!paid) return;

    const result = await paymentApi.finalizeOrder(payment.reference);

    showSuccess(`Order ${result.order.slug} placed successfully.`);
    await loadAuthedData().catch(() => undefined);
    router.replace('/(tabs)/orders');
  }, [loadAuthedData, mtnPhone, pollPaymentStatus, selectedAddressId]);

  const onPlaceOrder = async () => {
    if (isBusy) return;

    if (!cartItems.length) {
      showInfo('Add items before checking out.');
      return;
    }

    if (!selectedAddressId) {
      showInfo('Please select or add a delivery address before placing your order.');
      return;
    }

    if (paymentProvider === 'AIRTEL') {
      showInfo('Airtel Money is not enabled yet.');
      return;
    }

    setLoading(true);

    try {
      if (paymentProvider === 'CASH') {
        await handleCashCheckout();
        return;
      }

      if (paymentProvider === 'MTN') {
        await handleMTNCheckout();
        return;
      }

      showError('Unsupported payment method.');
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
                    expanded={item.id === expandedAddressId}
                    onSelect={() => onSelectAddress(item)}
                    onToggleExpand={() => onToggleAddressExpand(item.id)}
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
            <Text style={styles.title}>Payment method</Text>
            <View style={styles.divider} />

            {cashOption ? (
              <Pressable
                onPress={() => setPaymentProvider(cashOption.value)}
                style={[
                  styles.cashPaymentOption,
                  paymentProvider === cashOption.value &&
                    styles.paymentOptionSelected,
                ]}
              >
                <View style={styles.paymentRadio}>
                  {paymentProvider === cashOption.value && (
                    <View style={styles.paymentRadioInner} />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.paymentLabel,
                      paymentProvider === cashOption.value &&
                        styles.paymentLabelSelected,
                    ]}
                  >
                    {cashOption.label}
                  </Text>
                  <Text style={styles.paymentSubtitle}>
                    {cashOption.subtitle}
                  </Text>
                </View>
              </Pressable>
            ) : null}

            <View style={styles.iconPaymentRow}>
              {mobileMoneyOptions.map((option) => {
                const selected = paymentProvider === option.value;
                const icon =
                  option.value === 'MTN'
                    ? PAYMENT_ICONS.MTN
                    : PAYMENT_ICONS.AIRTEL;
                const disabled = option.value === 'AIRTEL';

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      if (disabled) {
                        showInfo('Airtel Money is coming soon.');
                        return;
                      }
                      setPaymentProvider(option.value);
                    }}
                    style={[
                      styles.iconPaymentCard,
                      selected && styles.iconPaymentCardSelected,
                      disabled && styles.disabledPaymentCard,
                    ]}
                  >
                    <View style={styles.iconPaymentTop}>
                      <Image
                        source={icon}
                        style={styles.smallPaymentIcon}
                        resizeMode="contain"
                      />

                      <View style={styles.paymentRadio}>
                        {selected && <View style={styles.paymentRadioInner} />}
                      </View>
                    </View>

                    {disabled ? (
                      <Text style={styles.comingSoonText}>Coming soon</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {paymentProvider === 'MTN' ? (
              <View style={styles.mtnPhoneWrap}>
                <Text style={styles.sectionLabel}>MTN phone number</Text>
                <TextInput
                  placeholder="078XXXXXXX or +25678XXXXXXX"
                  placeholderTextColor={colors.muted}
                  value={mtnPhone}
                  onChangeText={setMtnPhone}
                  keyboardType="phone-pad"
                  style={styles.input}
                  editable={!isBusy}
                />
                <Text style={styles.helperText}>
                  Use the number that will receive and approve the MTN prompt.
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Order summary</Text>
            <View style={styles.divider} />

            {cartItems.map((item) => {
              const itemTotal =
                item.line_total ?? Number(item.variant?.price || 0) * item.quantity;

              return (
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

                  <Text style={styles.price}>{money(itemTotal)}</Text>
                </View>
              );
            })}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{money(total)}</Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.button,
              isPlaceOrderDisabled && styles.buttonDisabled,
            ]}
            onPress={onPlaceOrder}
            disabled={isPlaceOrderDisabled}
          >
            <Text style={styles.buttonText}>
              {loading
                ? paymentProvider === 'MTN'
                  ? 'Starting payment...'
                  : 'Placing order...'
                : pollingPayment
                ? 'Waiting for payment approval...'
                : 'Place order'}
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
    flex: 1,
  },

  addressBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
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

  expandBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  expandBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
    lineHeight: 20,
  },

  addressDetails: {
    gap: 4,
    marginTop: 4,
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

  cashPaymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: spacing.md,
  },

  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },

  paymentRadio: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  paymentRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },

  paymentLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },

  paymentLabelSelected: {
    color: colors.primary,
  },

  paymentSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted,
  },

  iconPaymentRow: {
    flexDirection: 'row',
    gap: 12,
  },

  iconPaymentCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 56,
    justifyContent: 'center',
  },

  iconPaymentCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },

  disabledPaymentCard: {
    opacity: 0.7,
  },

  iconPaymentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  smallPaymentIcon: {
    width: 64,
    height: 28,
  },

  comingSoonText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },

  mtnPhoneWrap: {
    gap: 8,
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },

  helperText: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },

  textArea: {
    minHeight: 100,
  },

  regionSection: {
    gap: 10,
  },

  regionOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  regionChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  regionChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },

  regionChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },

  regionChipTextActive: {
    color: colors.primary,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },

  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: spacing.lg,
    maxHeight: '88%',
    gap: 16,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },

  form: {
    gap: 12,
    paddingBottom: 8,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },

  actionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cancelBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  saveBtn: {
    backgroundColor: colors.primary,
  },

  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },

  itemInfo: {
    flex: 1,
    gap: 4,
  },

  itemText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },

  itemMeta: {
    fontSize: 12,
    color: colors.muted,
  },

  price: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },

  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },

  button: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
});