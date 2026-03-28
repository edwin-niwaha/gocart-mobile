import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
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

function AddressForm({
  initialValues,
  visible,
  loading,
  onClose,
  onSubmit,
}: {
  initialValues: AddressFormValues;
  visible: boolean;
  loading: boolean;
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
      Alert.alert('Missing field', 'Street name / building / apartment is required.');
      return;
    }

    if (!city) {
      Alert.alert('Missing field', 'City is required.');
      return;
    }

    if (phoneNumber && additionalTelephone && phoneNumber === additionalTelephone) {
      Alert.alert(
        'Invalid phone numbers',
        'Additional telephone must be different from phone number.'
      );
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

  const isEditing = Boolean(initialValues.street_name);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {isEditing ? 'Update Address' : 'Add Address'}
          </Text>

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
                loading && styles.disabledBtn,
              ]}
              disabled={loading}
            >
              <Text style={styles.saveBtnText}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function AddressCard({
  item,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onMakeDefault,
}: {
  item: CustomerAddress;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMakeDefault: () => void;
}) {
  const regionLabel =
    REGION_OPTIONS.find((option) => option.value === item.region)?.label ??
    item.region;

  const previewLine = [item.street_name, item.city]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>{item.city || 'Address'}</Text>
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </View>

        <Pressable onPress={onToggleExpand} style={styles.expandBtn}>
          <Text style={styles.expandBtnText}>{expanded ? '-' : '+'}</Text>
        </Pressable>
      </View>

      <Text style={styles.previewText} numberOfLines={expanded ? undefined : 1}>
        {previewLine || 'No address summary'}
      </Text>

      {!expanded ? (
        <Text style={styles.previewSubtext}>{regionLabel}</Text>
      ) : (
        <>
          <View style={styles.divider} />

          <View style={styles.detailsBlock}>
            <Text style={styles.detailLabel}>Street</Text>
            <Text style={styles.cardText}>{item.street_name || '-'}</Text>
          </View>

          <View style={styles.detailsBlock}>
            <Text style={styles.detailLabel}>City</Text>
            <Text style={styles.cardText}>{item.city || '-'}</Text>
          </View>

          <View style={styles.detailsBlock}>
            <Text style={styles.detailLabel}>Region</Text>
            <Text style={styles.cardText}>{regionLabel}</Text>
          </View>

          {!!item.phone_number && (
            <View style={styles.detailsBlock}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.cardText}>{item.phone_number}</Text>
            </View>
          )}

          {!!item.additional_telephone && (
            <View style={styles.detailsBlock}>
              <Text style={styles.detailLabel}>Alternative phone</Text>
              <Text style={styles.cardText}>{item.additional_telephone}</Text>
            </View>
          )}

          {!!item.additional_information && (
            <View style={styles.detailsBlock}>
              <Text style={styles.detailLabel}>Additional info</Text>
              <Text style={styles.cardText}>{item.additional_information}</Text>
            </View>
          )}

          <View style={styles.cardActions}>
            {!item.is_default && (
              <Pressable onPress={onMakeDefault} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Make default</Text>
              </Pressable>
            )}

            <Pressable onPress={onEdit} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Edit</Text>
            </Pressable>

            <Pressable
              onPress={onDelete}
              style={[styles.secondaryBtn, styles.deleteBtn]}
            >
              <Text style={[styles.secondaryBtnText, styles.deleteBtnText]}>
                Delete
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

export default function AddressesScreen() {
  const {
    addresses,
    loadAuthedData,
    addAddress,
    updateAddress,
    removeAddress,
  } = useShop();

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  useEffect(() => {
    loadAuthedData().catch(() => undefined);
  }, [loadAuthedData]);

  const initialValues = useMemo<AddressFormValues>(() => {
    if (!editing) return EMPTY_FORM;

    return {
      street_name: editing.street_name ?? '',
      city: editing.city ?? '',
      phone_number: editing.phone_number ?? '',
      additional_telephone: editing.additional_telephone ?? '',
      additional_information: editing.additional_information ?? '',
      region: editing.region ?? 'kampala_area',
      is_default: Boolean(editing.is_default),
    };
  }, [editing]);

  const openAdd = () => {
    setEditing(null);
    setModalVisible(true);
  };

  const openEdit = (item: CustomerAddress) => {
    setEditing(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditing(null);
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const submit = async (values: CustomerAddressPayload) => {
    try {
      setSaving(true);

      const ok = editing
        ? await updateAddress(editing.id, values)
        : await addAddress(values);

      if (ok) {
        closeModal();
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (item: CustomerAddress) => {
    Alert.alert('Delete address', `Delete address in ${item.city}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeAddress(item.id);
          } catch (error: any) {
            Alert.alert('Delete failed', error.message || 'Could not delete address.');
          }
        },
      },
    ]);
  };

  const makeDefault = async (item: CustomerAddress) => {
    await updateAddress(item.id, { is_default: true });
  };

  return (
    <Screen scroll contentContainerStyle={styles.screenContent}>
      <AuthGate message="Log in to manage your addresses.">
        <View style={styles.container}>
          <View style={styles.heroCard}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.pageTitle}>My Addresses</Text>
              <Text style={styles.pageSubtitle}>
                Save and manage delivery locations for faster checkout.
              </Text>
            </View>

            <Pressable onPress={openAdd} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Add Address</Text>
            </Pressable>
          </View>

          {!addresses.length ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                title="No addresses yet"
                subtitle="Add a delivery address to make checkout faster."
              />
            </View>
          ) : (
            <View style={styles.list}>
              {addresses.map((item) => {
                const expanded = expandedIds.includes(item.id);

                return (
                  <AddressCard
                    key={item.id}
                    item={item}
                    expanded={expanded}
                    onToggleExpand={() => toggleExpand(item.id)}
                    onEdit={() => openEdit(item)}
                    onDelete={() => confirmDelete(item)}
                    onMakeDefault={() => makeDefault(item)}
                  />
                );
              })}
            </View>
          )}
        </View>

        <AddressForm
          visible={modalVisible}
          initialValues={initialValues}
          loading={saving}
          onClose={closeModal}
          onSubmit={submit}
        />
      </AuthGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  container: {
    gap: spacing.md,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroTextWrap: {
    gap: 6,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
  },
  pageSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  emptyWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  previewSubtext: {
    fontSize: 13,
    color: colors.muted,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  detailsBlock: {
    gap: 2,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  defaultBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  defaultBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  expandBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expandBtnText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    lineHeight: 22,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  secondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtn: {
    borderColor: `${colors.danger}33`,
    backgroundColor: `${colors.danger}10`,
  },
  deleteBtnText: {
    color: colors.danger,
  },
  addBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  addBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800',
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
  disabledBtn: {
    opacity: 0.6,
  },
});