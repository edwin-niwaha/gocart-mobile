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

    if (
      phoneNumber &&
      additionalTelephone &&
      phoneNumber === additionalTelephone
    ) {
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
  onEdit,
  onDelete,
  onMakeDefault,
}: {
  item: CustomerAddress;
  onEdit: () => void;
  onDelete: () => void;
  onMakeDefault: () => void;
}) {
  const regionLabel =
    REGION_OPTIONS.find((option) => option.value === item.region)?.label ??
    item.region;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.labelWrap}>
          <Text style={styles.cardTitle}>{item.city}</Text>
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.cardText}>{item.street_name}</Text>
      <Text style={styles.cardText}>{item.city}</Text>
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

      <View style={styles.cardActions}>
        {!item.is_default && (
          <Pressable onPress={onMakeDefault} style={styles.smallBtn}>
            <Text style={styles.smallBtnText}>Make default</Text>
          </Pressable>
        )}

        <Pressable onPress={onEdit} style={styles.smallBtn}>
          <Text style={styles.smallBtnText}>Edit</Text>
        </Pressable>

        <Pressable onPress={onDelete} style={[styles.smallBtn, styles.deleteBtn]}>
          <Text style={[styles.smallBtnText, styles.deleteBtnText]}>Delete</Text>
        </Pressable>
      </View>
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
        onPress: () => removeAddress(item.id),
      },
    ]);
  };

  const makeDefault = async (item: CustomerAddress) => {
    await updateAddress(item.id, { is_default: true });
  };

  return (
    <Screen scroll contentContainerStyle={{ paddingTop: 0 }}>
      <AuthGate message="Log in to manage your addresses.">
        <View style={styles.container}>
          <Pressable onPress={openAdd} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add Address</Text>
          </Pressable>

          {!addresses.length ? (
            <EmptyState
              title="No addresses yet"
              subtitle="Add a delivery address to make checkout faster."
            />
          ) : (
            <View style={styles.list}>
              {addresses.map((item) => (
                <AddressCard
                  key={item.id}
                  item={item}
                  onEdit={() => openEdit(item)}
                  onDelete={() => confirmDelete(item)}
                  onMakeDefault={() => makeDefault(item)}
                />
              ))}
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
  container: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  cardText: {
    fontSize: 14,
    color: colors.text,
  },
  defaultBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  defaultBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallBtnText: {
    color: colors.text,
    fontSize: 12,
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
    height: 48,
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