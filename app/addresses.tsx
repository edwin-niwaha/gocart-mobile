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
import type { CustomerAddress, CustomerAddressPayload } from '@/types';

const EMPTY_FORM: CustomerAddressPayload = {
  label: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  phone_number: '',
  is_default: false,
};

function AddressForm({
  initialValues,
  visible,
  loading,
  onClose,
  onSubmit,
}: {
  initialValues: CustomerAddressPayload;
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: CustomerAddressPayload) => void;
}) {
  const [form, setForm] = useState<CustomerAddressPayload>(initialValues);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  const setField = (key: keyof CustomerAddressPayload, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = () => {
    if (!form.address_line1.trim()) {
      Alert.alert('Missing field', 'Address line 1 is required.');
      return;
    }
    if (!form.city.trim()) {
      Alert.alert('Missing field', 'City is required.');
      return;
    }
    if (!form.postal_code.trim()) {
      Alert.alert('Missing field', 'Postal code is required.');
      return;
    }
    if (!form.country.trim()) {
      Alert.alert('Missing field', 'Country is required.');
      return;
    }

    onSubmit({
      ...form,
      label: form.label.trim(),
      address_line1: form.address_line1.trim(),
      address_line2: form.address_line2?.trim() || '',
      city: form.city.trim(),
      state: form.state?.trim() || '',
      postal_code: form.postal_code.trim(),
      country: form.country.trim(),
      phone_number: form.phone_number?.trim() || '',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {initialValues.address_line1 ? 'Update Address' : 'Add Address'}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
            <TextInput
              placeholder="Label (Home, Office)"
              placeholderTextColor={colors.muted}
              value={form.label}
              onChangeText={(v) => setField('label', v)}
              style={styles.input}
            />
            <TextInput
              placeholder="Address line 1"
              placeholderTextColor={colors.muted}
              value={form.address_line1}
              onChangeText={(v) => setField('address_line1', v)}
              style={styles.input}
            />
            <TextInput
              placeholder="Address line 2"
              placeholderTextColor={colors.muted}
              value={form.address_line2}
              onChangeText={(v) => setField('address_line2', v)}
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
              placeholder="State"
              placeholderTextColor={colors.muted}
              value={form.state}
              onChangeText={(v) => setField('state', v)}
              style={styles.input}
            />
            <TextInput
              placeholder="Postal code"
              placeholderTextColor={colors.muted}
              value={form.postal_code}
              onChangeText={(v) => setField('postal_code', v)}
              style={styles.input}
            />
            <TextInput
              placeholder="Country"
              placeholderTextColor={colors.muted}
              value={form.country}
              onChangeText={(v) => setField('country', v)}
              style={styles.input}
            />
            <TextInput
              placeholder="Phone number"
              placeholderTextColor={colors.muted}
              value={form.phone_number}
              onChangeText={(v) => setField('phone_number', v)}
              style={styles.input}
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Set as default</Text>
              <Switch
                value={!!form.is_default}
                onValueChange={(v) => setField('is_default', v)}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={[styles.actionBtn, styles.cancelBtn]}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={submit}
              style={[styles.actionBtn, styles.saveBtn, loading && styles.disabledBtn]}
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
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.labelWrap}>
          <Text style={styles.cardTitle}>{item.label || 'Address'}</Text>
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.cardText}>{item.address_line1}</Text>
      {!!item.address_line2 && <Text style={styles.cardText}>{item.address_line2}</Text>}
      <Text style={styles.cardText}>
        {item.city}
        {!!item.state ? `, ${item.state}` : ''} {item.postal_code}
      </Text>
      <Text style={styles.cardText}>{item.country}</Text>
      {!!item.phone_number && <Text style={styles.cardText}>{item.phone_number}</Text>}

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

  const initialValues = useMemo<CustomerAddressPayload>(() => {
    if (!editing) return EMPTY_FORM;

    return {
      label: editing.label || '',
      address_line1: editing.address_line1 || '',
      address_line2: editing.address_line2 || '',
      city: editing.city || '',
      state: editing.state || '',
      postal_code: editing.postal_code || '',
      country: editing.country || '',
      phone_number: editing.phone_number || '',
      is_default: editing.is_default || false,
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
    setSaving(true);

    const ok = editing
      ? await updateAddress(editing.id, values)
      : await addAddress(values);

    setSaving(false);

    if (ok) {
      closeModal();
    }
  };

  const confirmDelete = (item: CustomerAddress) => {
    Alert.alert(
      'Delete address',
      `Delete ${item.label || item.address_line1}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeAddress(item.id),
        },
      ]
    );
  };

  const makeDefault = async (item: CustomerAddress) => {
    await updateAddress(item.id, { is_default: true });
  };

  return (
    <Screen scroll>
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