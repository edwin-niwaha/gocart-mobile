import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import { AuthGate } from "@/components/AuthGate";
import { EmptyState } from "@/components/EmptyState";
import { Screen } from "@/components/Screen";
import { colors, spacing } from "@/constants/theme";
import { useShop } from "@/providers/ShopProvider";
import type {
  CustomerAddress,
  CustomerAddressPayload,
  CustomerAddressRegion,
  DeliveryOption,
  PickupStation,
} from "@/types";
import { money } from "@/utils/format";
import { getCartItemTotal, getCartTotal } from "@/utils/product";
import {
  checkoutApi,
  getErrorMessage,
  paymentApi,
  shippingApi,
  type CheckoutSummary,
  type CheckoutSummaryRequest,
  type PaymentStatusResponse,
} from "@/api/services";
import { createIdempotencyKey } from "@/utils/idempotency";

type PaymentProvider = "CASH" | "MTN" | "CARD";

type CardFormValues = {
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  billingEmail: string;
};

const DELIVERY_OPTIONS: readonly {
  label: string;
  subtitle: string;
  value: DeliveryOption;
}[] = [
  {
    label: "Home delivery",
    subtitle: "Delivered to your selected address",
    value: "HOME_DELIVERY",
  },
  {
    label: "Pickup station",
    subtitle: "Collect from a nearby station",
    value: "PICKUP_STATION",
  },
];

const PAYMENT_OPTIONS: readonly {
  label: string;
  subtitle: string;
  value: PaymentProvider;
}[] = [
  {
    label: "Pay on Delivery",
    subtitle: "Cash or Mobile Money on arrival",
    value: "CASH",
  },
  {
    label: "MTN Mobile Money",
    subtitle: "Pay instantly with MTN MoMo",
    value: "MTN",
  },
  {
    label: "Bank / Debit Card",
    subtitle: "Pay through the configured secure card gateway",
    value: "CARD",
  },
];

const PAYMENT_ICONS = {
  MTN: require("@/assets/images/momo/mtn.png"),
} as const;

const REGION_OPTIONS: readonly {
  label: string;
  value: CustomerAddressRegion;
}[] = [
  { label: "Kampala Area", value: "kampala_area" },
  { label: "Entebbe Area", value: "entebbe_area" },
  { label: "Central Region", value: "central_region" },
  { label: "Eastern Region", value: "eastern_region" },
  { label: "Northern Region", value: "northern_region" },
  { label: "Western Region", value: "western_region" },
  { label: "Rest of Kampala", value: "rest_of_kampala" },
];

type AddressFormValues = {
  street_name: string;
  city: string;
  area: string;
  phone_number: string;
  additional_telephone: string;
  additional_information: string;
  region: CustomerAddressRegion;
  is_default: boolean;
};

const EMPTY_FORM: AddressFormValues = {
  street_name: "",
  city: "",
  area: "",
  phone_number: "",
  additional_telephone: "",
  additional_information: "",
  region: "kampala_area",
  is_default: false,
};

const showSuccess = (message: string) => {
  Toast.show({
    type: "success",
    text1: "Success",
    text2: message,
    position: "top",
    visibilityTime: 3000,
  });
};

const showError = (message: string) => {
  Toast.show({
    type: "error",
    text1: "Error",
    text2: message,
    position: "top",
    visibilityTime: 4000,
  });
};

const showInfo = (message: string) => {
  Toast.show({
    type: "info",
    text1: "Info",
    text2: message,
    position: "top",
    visibilityTime: 3000,
  });
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeUgPhone = (value: string) => {
  const raw = value.trim().replace(/[^\d+]/g, "");

  if (!raw) return "";

  if (raw.startsWith("+256")) return raw;
  if (raw.startsWith("256")) return `+${raw}`;
  if (raw.startsWith("0")) return `+256${raw.slice(1)}`;

  return raw;
};

const isValidUgPhone = (value: string) => /^\+2567\d{8}$/.test(value);
const isValidMtnUgPhone = (value: string) =>
  /^\+256(76|77|78|79)\d{7}$/.test(value);

const DELIVERY_UNAVAILABLE_ERROR =
  "delivery is not available for this location";
const DELIVERY_LOCATION_MESSAGE =
  "Select a delivery location with region, city, and area so we can show the best home-delivery option. Pickup remains available when you prefer collection.";
const CARD_GATEWAY =
  process.env.EXPO_PUBLIC_CARD_PAYMENT_GATEWAY?.trim() || "placeholder";

const EMPTY_CARD_FORM: CardFormValues = {
  cardholderName: "",
  cardNumber: "",
  expiryMonth: "",
  expiryYear: "",
  cvv: "",
  billingEmail: "",
};

const normalizeCardNumber = (value: string) => value.replace(/\D/g, "");
const formatCardNumber = (value: string) =>
  normalizeCardNumber(value)
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
const getCardLast4 = (value: string) => normalizeCardNumber(value).slice(-4);

const validateCardForm = (form: CardFormValues) => {
  const errors: Partial<Record<keyof CardFormValues, string>> = {};
  const cardNumber = normalizeCardNumber(form.cardNumber);
  const month = Number(form.expiryMonth);
  const year =
    form.expiryYear.trim().length === 2
      ? Number(`20${form.expiryYear}`)
      : Number(form.expiryYear);
  const cvv = form.cvv.replace(/\D/g, "");

  if (!form.cardholderName.trim()) {
    errors.cardholderName = "Cardholder name is required.";
  }

  if (!/^\d{13,19}$/.test(cardNumber)) {
    errors.cardNumber = "Enter a valid card number.";
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    errors.expiryMonth = "Enter a valid expiry month.";
  }

  if (!Number.isInteger(year) || year < new Date().getFullYear()) {
    errors.expiryYear = "Enter a valid expiry year.";
  } else if (Number.isInteger(month)) {
    const now = new Date();
    const expiry = new Date(year, month, 0, 23, 59, 59);
    if (expiry < now) {
      errors.expiryYear = "Card expiry date is in the past.";
    }
  }

  if (!/^\d{3,4}$/.test(cvv)) {
    errors.cvv = "CVV must be 3 or 4 digits.";
  }

  if (
    form.billingEmail.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.billingEmail.trim())
  ) {
    errors.billingEmail = "Enter a valid billing email.";
  }

  return errors;
};

const numeric = (...values: (string | number | null | undefined)[]) => {
  for (const value of values) {
    const parsed = Number(value ?? NaN);
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
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
    value: AddressFormValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = () => {
    const payload: CustomerAddressPayload = {
      street_name: form.street_name.trim(),
      city: form.city.trim(),
      area: form.area.trim(),
      phone_number: form.phone_number.trim(),
      additional_telephone: form.additional_telephone.trim(),
      additional_information: form.additional_information.trim(),
      region: form.region,
      is_default: form.is_default,
    };

    if (!payload.street_name) {
      showInfo("Street name / building / apartment is required.");
      return;
    }

    if (!payload.city) {
      showInfo("City is required.");
      return;
    }

    if (
      payload.phone_number &&
      payload.additional_telephone &&
      payload.phone_number === payload.additional_telephone
    ) {
      showError("Additional telephone must be different from phone number.");
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
              onChangeText={(v) => setField("street_name", v)}
              style={styles.input}
            />

            <TextInput
              placeholder="City"
              placeholderTextColor={colors.muted}
              value={form.city}
              onChangeText={(v) => setField("city", v)}
              style={styles.input}
            />

            <TextInput
              placeholder="Area / Neighborhood"
              placeholderTextColor={colors.muted}
              value={form.area}
              onChangeText={(v) => setField("area", v)}
              style={styles.input}
            />

            <TextInput
              placeholder="Phone number"
              placeholderTextColor={colors.muted}
              value={form.phone_number}
              onChangeText={(v) => setField("phone_number", v)}
              keyboardType="phone-pad"
              style={styles.input}
            />

            <TextInput
              placeholder="Additional telephone"
              placeholderTextColor={colors.muted}
              value={form.additional_telephone}
              onChangeText={(v) => setField("additional_telephone", v)}
              keyboardType="phone-pad"
              style={styles.input}
            />

            <TextInput
              placeholder="Additional information"
              placeholderTextColor={colors.muted}
              value={form.additional_information}
              onChangeText={(v) => setField("additional_information", v)}
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
                      onPress={() => setField("region", option.value)}
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
                onValueChange={(v) => setField("is_default", v)}
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
                {loading ? "Saving..." : "Save address"}
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
            <Text style={styles.expandBtnText}>{expanded ? "-" : "+"}</Text>
          </Pressable>
        </View>
      </View>

      {expanded ? (
        <View style={styles.addressDetails}>
          <Text style={styles.cardText}>{item.street_name}</Text>
          {!!item.area && <Text style={styles.cardText}>{item.area}</Text>}
          <Text style={styles.cardText}>{regionLabel}</Text>

          {!!item.phone_number && (
            <Text style={styles.cardText}>Phone: {item.phone_number}</Text>
          )}

          {!!item.additional_telephone && (
            <Text style={styles.cardText}>
              Alt: {item.additional_telephone}
            </Text>
          )}

          {!!item.additional_information && (
            <Text style={styles.cardText}>{item.additional_information}</Text>
          )}
        </View>
      ) : null}
    </Pressable>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStatCard}>
      <Text style={styles.heroStatLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.heroStatValue}>
        {value}
      </Text>
    </View>
  );
}

function StepHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.sectionTitleBlock}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}
export default function CheckoutScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 380;

  const {
    loading: accountLoading,
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
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [expandedAddressId, setExpandedAddressId] = useState<number | null>(
    null,
  );
  const [paymentProvider, setPaymentProvider] =
    useState<PaymentProvider>("CASH");
  const [deliveryOption, setDeliveryOption] =
    useState<DeliveryOption>("HOME_DELIVERY");
  const [pickupStations, setPickupStations] = useState<PickupStation[]>([]);
  const [selectedPickupStationId, setSelectedPickupStationId] = useState<
    number | null
  >(null);
  const [loadingPickupStations, setLoadingPickupStations] = useState(false);
  const [mtnPhone, setMtnPhone] = useState("");
  const [cardForm, setCardForm] = useState<CardFormValues>(EMPTY_CARD_FORM);
  const [cardErrors, setCardErrors] = useState<
    Partial<Record<keyof CardFormValues, string>>
  >({});
  const [pollingPayment, setPollingPayment] = useState(false);
  const [checkoutSummary, setCheckoutSummary] =
    useState<CheckoutSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const checkoutIdempotencyKeyRef = useRef<string | null>(null);
  const paymentInitiationIdempotencyKeyRef = useRef<string | null>(null);
  const paymentFinalizationIdempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    loadAuthedData().catch(() => undefined);
  }, [loadAuthedData]);

  useEffect(() => {
    let active = true;

    const loadPickupStations = async () => {
      try {
        setLoadingPickupStations(true);
        const stations = await shippingApi.listPickupStations();
        if (!active) return;

        setPickupStations(Array.isArray(stations) ? stations : []);
      } catch {
        if (!active) return;
        setPickupStations([]);
      } finally {
        if (active) {
          setLoadingPickupStations(false);
        }
      }
    };

    loadPickupStations().catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!addresses.length) {
      setSelectedAddressId(null);
      setExpandedAddressId(null);
      return;
    }

    const selectedExists = addresses.some(
      (item) => item.id === selectedAddressId,
    );
    if (!selectedExists) {
      const defaultAddress = addresses.find((item) => item.is_default);
      const fallbackId = defaultAddress?.id ?? addresses[0]?.id ?? null;
      setSelectedAddressId(fallbackId);
      setExpandedAddressId(fallbackId);
    }

    const expandedExists = addresses.some(
      (item) => item.id === expandedAddressId,
    );
    if (!expandedExists) {
      setExpandedAddressId(null);
    }
  }, [addresses, selectedAddressId, expandedAddressId]);

  useEffect(() => {
    if (paymentProvider !== "MTN" && mtnPhone) {
      setMtnPhone("");
    }
  }, [paymentProvider, mtnPhone]);

  useEffect(() => {
    if (paymentProvider !== "CARD") {
      setCardErrors({});
    }
  }, [paymentProvider]);

  const cartSubtotal = useMemo(() => {
    return getCartTotal(cartItems);
  }, [cartItems]);

  const selectedAddress = useMemo(() => {
    return addresses.find((item) => item.id === selectedAddressId) ?? null;
  }, [addresses, selectedAddressId]);
  const selectedPickupStation = useMemo(() => {
    return (
      pickupStations.find((item) => item.id === selectedPickupStationId) ?? null
    );
  }, [pickupStations, selectedPickupStationId]);
  const estimatedPickupFee =
    deliveryOption === "PICKUP_STATION" && selectedPickupStation
      ? Number(selectedPickupStation.fee || 0)
      : 0;

  const buildCheckoutRequest = useCallback(
    (options?: { couponCode?: string }): CheckoutSummaryRequest | null => {
      if (!selectedAddressId) return null;
      if (deliveryOption === "PICKUP_STATION" && !selectedPickupStationId) {
        return null;
      }

      return {
        address_id: selectedAddressId,
        delivery_option: deliveryOption,
        pickup_station_id:
          deliveryOption === "PICKUP_STATION" ? selectedPickupStationId : null,
        ...(options?.couponCode ? { coupon_code: options.couponCode } : {}),
      };
    },
    [deliveryOption, selectedAddressId, selectedPickupStationId],
  );

  const cartSignature = useMemo(
    () =>
      cartItems
        .map((item) => `${item.id}:${item.quantity}:${item.variant?.id ?? ""}`)
        .join("|"),
    [cartItems],
  );

  useEffect(() => {
    let active = true;

    if (!cartItems.length) {
      setCheckoutSummary(null);
      setSummaryError("");
      setSummaryLoading(false);
      return () => {
        active = false;
      };
    }

    const request = buildCheckoutRequest({
      couponCode: appliedCouponCode || undefined,
    });

    if (!request) {
      setCheckoutSummary(null);
      setSummaryError("");
      setSummaryLoading(false);
      return () => {
        active = false;
      };
    }

    setSummaryLoading(true);
    setSummaryError("");

    checkoutApi
      .summary(request)
      .then((summary) => {
        if (!active) return;
        setCheckoutSummary(summary);
        setSummaryError("");
        if (appliedCouponCode) {
          setCouponCode(summary.coupon_code || appliedCouponCode);
          setCouponError("");
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = getErrorMessage(
          error,
          "Could not calculate checkout total.",
        );

        if (appliedCouponCode) {
          setCouponError(message);
          setAppliedCouponCode("");
          return;
        }

        setCheckoutSummary(null);
        setSummaryError(message);
      })
      .finally(() => {
        if (active) {
          setSummaryLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    appliedCouponCode,
    buildCheckoutRequest,
    cartItems.length,
    cartSignature,
  ]);

  const itemsSubtotal = useMemo(
    () =>
      numeric(
        checkoutSummary?.items_subtotal,
        checkoutSummary?.subtotal,
        cartSubtotal,
      ),
    [cartSubtotal, checkoutSummary],
  );

  const shippingFee = useMemo(
    () =>
      numeric(
        checkoutSummary?.shipping,
        checkoutSummary?.shipping_fee,
        deliveryOption === "PICKUP_STATION" ? 0 : null,
      ),
    [checkoutSummary, deliveryOption],
  );

  const discountAmount = useMemo(
    () => numeric(checkoutSummary?.discount, checkoutSummary?.discount_amount),
    [checkoutSummary],
  );

  const total = useMemo(
    () =>
      checkoutSummary
        ? numeric(checkoutSummary.total, checkoutSummary.total_price)
        : cartSubtotal + estimatedPickupFee,
    [cartSubtotal, checkoutSummary, estimatedPickupFee],
  );

  const cashOption = PAYMENT_OPTIONS.find((option) => option.value === "CASH");
  const digitalPaymentOptions = PAYMENT_OPTIONS.filter(
    (option) => option.value === "MTN" || option.value === "CARD",
  );

  const isBusy = loading || pollingPayment;
  const needsPickupStation = deliveryOption === "PICKUP_STATION";
  const needsCalculatedSummary =
    !!cartItems.length &&
    !!selectedAddressId &&
    (!needsPickupStation || !!selectedPickupStationId);
  const friendlySummaryError = summaryError
    .toLowerCase()
    .includes(DELIVERY_UNAVAILABLE_ERROR)
    ? DELIVERY_LOCATION_MESSAGE
    : summaryError;
  const isPlaceOrderDisabled =
    !cartItems.length ||
    !selectedAddressId ||
    (needsPickupStation && !selectedPickupStationId) ||
    summaryLoading ||
    (needsCalculatedSummary && (!checkoutSummary || !!summaryError)) ||
    isBusy;
  const paymentLabel =
    paymentProvider === "CASH"
      ? "Pay on Delivery"
      : paymentProvider === "MTN"
        ? "MTN Mobile Money"
        : "Bank / Debit Card";
  const itemCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );
  const deliveryLabel =
    deliveryOption === "PICKUP_STATION"
      ? selectedPickupStation?.name || "Pickup station"
      : selectedAddress?.city || "Address";
  const orderButtonLabel = loading
    ? paymentProvider === "MTN"
      ? "Starting payment..."
      : paymentProvider === "CARD"
        ? "Starting card payment..."
        : "Placing order..."
    : pollingPayment
      ? "Waiting for approval..."
      : `Place order • ${money(total)}`;

  const openAddAddress = () => setAddressModalVisible(true);
  const closeAddAddress = () => setAddressModalVisible(false);

  const submitNewAddress = async (values: CustomerAddressPayload) => {
    try {
      setSavingAddress(true);
      const created = await addAddress(values);

      if (!created) return;

      const nextId =
        typeof created === "object" && created !== null && "id" in created
          ? Number(created.id)
          : null;

      if (nextId) {
        setSelectedAddressId(nextId);
        setExpandedAddressId(nextId);
      }

      closeAddAddress();
      showSuccess("Address saved successfully.");
    } catch (error: unknown) {
      showError(
        getErrorMessage(error, "Failed to save address. Please try again."),
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
      showSuccess("Default address updated successfully.");
      await loadAuthedData().catch(() => undefined);
    } catch (error: unknown) {
      showError(
        getErrorMessage(error, "Failed to update address. Please try again."),
      );
    }
  };

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    setCouponError("");

    if (!code) {
      setCouponError("Enter a coupon code.");
      return;
    }

    if (!cartItems.length || cartSubtotal <= 0) {
      setCouponError("Add items before applying a coupon.");
      return;
    }

    const request = buildCheckoutRequest({ couponCode: code });
    if (!request) {
      setCouponError(
        deliveryOption === "PICKUP_STATION"
          ? "Choose a contact address and pickup station before applying a coupon."
          : "Choose a delivery address before applying a coupon.",
      );
      return;
    }

    try {
      setApplyingCoupon(true);
      const summary = await checkoutApi.validate(request);
      setCheckoutSummary(summary);
      setAppliedCouponCode(summary.coupon_code || code);
      setCouponCode(summary.coupon_code || code);
      setSummaryError("");
      showSuccess("Coupon applied successfully.");
    } catch (error: unknown) {
      setCouponError(getErrorMessage(error, "Coupon could not be applied."));
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCouponCode("");
    setCouponCode("");
    setCouponError("");
  };

  const getMtnFailureMessage = (statusRes: PaymentStatusResponse): string => {
    const providerResponse = statusRes.provider_response ?? {};
    const statusCheck =
      typeof providerResponse.status_check === "object" &&
      providerResponse.status_check !== null
        ? (providerResponse.status_check as Record<string, unknown>)
        : {};
    const reason = statusCheck.reason || providerResponse.reason || "";

    const normalized = String(reason).toUpperCase();

    switch (normalized) {
      case "LOW_BALANCE_OR_PAYEE_LIMIT_REACHED_OR_NOT_ALLOWED":
        return "Payment failed. Your MTN line may not have enough balance, transaction limits may be reached, or the account is not allowed for this payment.";

      case "REJECTED":
        return "Payment was declined on your phone. Please try again.";

      case "EXPIRED":
        return "Payment request expired. Please try again.";

      case "NOT_ALLOWED":
        return "This MTN number is not allowed to make this payment.";

      default:
        return "Payment failed. Please try again or use a different payment method.";
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
        const paymentStatus = String(statusRes?.status || "").toUpperCase();

        if (paymentStatus === "PAID") {
          showSuccess("Payment successful.");
          return true;
        }

        if (paymentStatus === "FAILED") {
          const message = getMtnFailureMessage(statusRes);
          showError(message);
          return false;
        }

        if (paymentStatus === "CANCELLED") {
          showError("You cancelled the payment on your phone.");
          return false;
        }

        if (attempt === 5 || attempt === 10) {
          showInfo("Still waiting for MTN payment approval...");
        }
      }

      showInfo(
        "Payment is still processing. Please confirm later from your payment status or orders.",
      );
      return false;
    } catch (error: unknown) {
      showError(
        getErrorMessage(error, "Could not confirm payment status right now."),
      );
      return false;
    } finally {
      setPollingPayment(false);
    }
  }, []);

  const handleCashCheckout = useCallback(async () => {
    if (!selectedAddressId) {
      showInfo("Please select a delivery address.");
      return;
    }

    const idempotencyKey =
      checkoutIdempotencyKeyRef.current ?? createIdempotencyKey("checkout");
    checkoutIdempotencyKeyRef.current = idempotencyKey;

    const order = await checkout(
      {
        address_id: selectedAddressId,
        delivery_option: deliveryOption,
        payment_method: "CASH",
        pickup_station_id:
          deliveryOption === "PICKUP_STATION" ? selectedPickupStationId : null,
        ...(appliedCouponCode ? { coupon_code: appliedCouponCode } : {}),
      },
      { idempotencyKey },
    );

    try {
      await paymentApi.create(
        {
          order: order.id,
          provider: "CASH",
          amount: total,
          currency: "UGX",
        },
        { idempotencyKey: createIdempotencyKey("payment-create") },
      );
    } catch (paymentError: any) {
      showError(
        paymentError?.response?.data?.detail ||
          paymentError?.message ||
          "Order placed but payment record could not be saved.",
      );
    }

    showSuccess(`Order ${order.slug} placed successfully.`);
    await loadAuthedData().catch(() => undefined);
    router.replace("/(tabs)/orders");
  }, [
    checkout,
    appliedCouponCode,
    deliveryOption,
    loadAuthedData,
    selectedAddressId,
    selectedPickupStationId,
    total,
  ]);

  const handleMTNCheckout = useCallback(async () => {
    if (!selectedAddressId) {
      showInfo("Please select a delivery address.");
      return;
    }

    const normalizedPhone = normalizeUgPhone(mtnPhone);

    if (!normalizedPhone) {
      showInfo("Enter your MTN phone number.");
      return;
    }

    if (!isValidUgPhone(normalizedPhone)) {
      showError(
        "Enter a valid Uganda number like 078XXXXXXX or +25678XXXXXXX.",
      );
      return;
    }

    if (!isValidMtnUgPhone(normalizedPhone)) {
      showError("Please enter a valid MTN Mobile Money number.");
      return;
    }

    if (deliveryOption === "PICKUP_STATION" && !selectedPickupStationId) {
      showInfo("Please select a pickup station.");
      return;
    }

    const paymentIdempotencyKey =
      paymentInitiationIdempotencyKeyRef.current ??
      createIdempotencyKey("payment-initiate");
    paymentInitiationIdempotencyKeyRef.current = paymentIdempotencyKey;

    const payment = await paymentApi.initiateMTN(
      {
        address_id: selectedAddressId,
        phone_number: normalizedPhone,
        delivery_option: deliveryOption,
        pickup_station_id:
          deliveryOption === "PICKUP_STATION" ? selectedPickupStationId : null,
        ...(appliedCouponCode ? { coupon_code: appliedCouponCode } : {}),
      },
      { idempotencyKey: paymentIdempotencyKey },
    );

    showInfo("Approve the MTN Mobile Money prompt on your phone.");

    const paid = await pollPaymentStatus(payment.reference);
    if (!paid) return;

    const finalizationIdempotencyKey =
      paymentFinalizationIdempotencyKeyRef.current ??
      createIdempotencyKey("payment-finalize");
    paymentFinalizationIdempotencyKeyRef.current = finalizationIdempotencyKey;

    const result = await paymentApi.finalizeOrder(payment.reference, {
      idempotencyKey: finalizationIdempotencyKey,
    });

    showSuccess(`Order ${result.order.slug} placed successfully.`);
    await loadAuthedData().catch(() => undefined);
    router.replace("/(tabs)/orders");
  }, [
    appliedCouponCode,
    deliveryOption,
    loadAuthedData,
    mtnPhone,
    pollPaymentStatus,
    selectedAddressId,
    selectedPickupStationId,
  ]);

  const handleCardCheckout = useCallback(async () => {
    if (!selectedAddressId) {
      showInfo("Please select a delivery address.");
      return;
    }

    const errors = validateCardForm(cardForm);
    setCardErrors(errors);

    if (Object.keys(errors).length) {
      showError("Please fix the card details before continuing.");
      return;
    }

    const paymentIdempotencyKey =
      paymentInitiationIdempotencyKeyRef.current ??
      createIdempotencyKey("payment-card-initiate");
    paymentInitiationIdempotencyKeyRef.current = paymentIdempotencyKey;

    // TODO: Wire this to a PCI-compliant hosted/tokenized card gateway.
    // Never send full card numbers or CVV to GoCart servers.
    const payment = await paymentApi.initiateCard(
      {
        address_id: selectedAddressId,
        delivery_option: deliveryOption,
        pickup_station_id:
          deliveryOption === "PICKUP_STATION" ? selectedPickupStationId : null,
        ...(appliedCouponCode ? { coupon_code: appliedCouponCode } : {}),
        gateway: CARD_GATEWAY,
        cardholder_name: cardForm.cardholderName.trim(),
        card_last4: getCardLast4(cardForm.cardNumber),
        expiry_month: Number(cardForm.expiryMonth),
        expiry_year:
          cardForm.expiryYear.trim().length === 2
            ? Number(`20${cardForm.expiryYear}`)
            : Number(cardForm.expiryYear),
        billing_email: cardForm.billingEmail.trim() || undefined,
        billing_phone: selectedAddress?.phone_number || undefined,
      },
      { idempotencyKey: paymentIdempotencyKey },
    );

    if (payment.checkout_url) {
      showInfo("Opening the secure card payment page...");
      await Linking.openURL(payment.checkout_url);
      return;
    }

    if (!payment.reference) {
      throw new Error("Card payment could not be started.");
    }

    showInfo("Processing card payment securely...");

    const paid =
      String(payment.status || "").toUpperCase() === "PAID" ||
      (await pollPaymentStatus(payment.reference));
    if (!paid) return;

    const finalizationIdempotencyKey =
      paymentFinalizationIdempotencyKeyRef.current ??
      createIdempotencyKey("payment-finalize");
    paymentFinalizationIdempotencyKeyRef.current = finalizationIdempotencyKey;

    const result = await paymentApi.finalizeOrder(payment.reference, {
      idempotencyKey: finalizationIdempotencyKey,
    });

    showSuccess(`Order ${result.order.slug} placed successfully.`);
    await loadAuthedData().catch(() => undefined);
    router.replace("/(tabs)/orders");
  }, [
    appliedCouponCode,
    cardForm,
    deliveryOption,
    loadAuthedData,
    pollPaymentStatus,
    selectedAddress,
    selectedAddressId,
    selectedPickupStationId,
  ]);

  const onPlaceOrder = async () => {
    if (isBusy) return;

    if (!cartItems.length) {
      showInfo("Add items before checking out.");
      return;
    }

    if (!selectedAddressId) {
      showInfo(
        "Please select or add a delivery address before placing your order.",
      );
      return;
    }

    if (needsPickupStation && !selectedPickupStationId) {
      showInfo("Please select a pickup station before placing your order.");
      return;
    }

    if (summaryLoading) {
      showInfo("Calculating your checkout total. Please wait a moment.");
      return;
    }

    if (needsCalculatedSummary && (!checkoutSummary || summaryError)) {
      showError(
        friendlySummaryError ||
          "We could not calculate the delivery fee for this order.",
      );
      return;
    }

    setLoading(true);

    try {
      if (paymentProvider === "CASH") {
        await handleCashCheckout();
        return;
      }

      if (paymentProvider === "MTN") {
        await handleMTNCheckout();
        return;
      }

      if (paymentProvider === "CARD") {
        await handleCardCheckout();
        return;
      }

      showError("Unsupported payment method.");
    } catch (error: unknown) {
      showError(getErrorMessage(error, "Checkout failed. Please try again."));
    } finally {
      checkoutIdempotencyKeyRef.current = null;
      paymentInitiationIdempotencyKeyRef.current = null;
      paymentFinalizationIdempotencyKeyRef.current = null;
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentContainerStyle={{ paddingTop: 0 }}>
      <AuthGate message="Please log in before placing an order.">
        <View style={styles.container}>
          <View style={[styles.heroCard, compact && styles.heroCardCompact]}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIcon}>
                <Text style={styles.heroIconText}>✓</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>SECURE CHECKOUT</Text>
                <Text style={styles.heroTitle}>Complete your order</Text>
              </View>
            </View>

            <View style={styles.heroStatsGrid}>
              <HeroStat label="Items" value={`${itemCount}`} />
            </View>

            <View style={styles.heroStatsGrid}>
              <HeroStat label="Delivery" value={deliveryLabel} />
            </View>

            <View style={styles.heroStatsGrid}>
              <HeroStat
                label="Total"
                value={summaryLoading ? "..." : money(total)}
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <StepHeader eyebrow="ADDRESS" title="Choose address" />

              <Pressable onPress={openAddAddress} style={styles.linkPill}>
                <Text style={styles.linkPillText}>+ Add new</Text>
              </Pressable>
            </View>

            {accountLoading && !addresses.length ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.helperText}>
                  Loading delivery details...
                </Text>
              </View>
            ) : !addresses.length ? (
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
            <StepHeader eyebrow="DELIVERY" title="Delivery method" />

            <View style={styles.addressList}>
              {DELIVERY_OPTIONS.map((option) => {
                const selected = deliveryOption === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setDeliveryOption(option.value)}
                    style={[
                      styles.addressCard,
                      selected && styles.addressCardSelected,
                    ]}
                  >
                    <View style={styles.addressHeader}>
                      <Text style={styles.addressTitle}>{option.label}</Text>
                      {selected ? (
                        <View style={styles.selectedBadge}>
                          <Text style={styles.selectedBadgeText}>Selected</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.cardText}>{option.subtitle}</Text>
                  </Pressable>
                );
              })}
            </View>

            {deliveryOption === "PICKUP_STATION" ? (
              loadingPickupStations ? (
                <Text style={styles.helperText}>
                  Loading pickup stations...
                </Text>
              ) : pickupStations.length ? (
                <View style={styles.addressList}>
                  {pickupStations.map((station) => {
                    const selected = station.id === selectedPickupStationId;

                    return (
                      <Pressable
                        key={station.id}
                        onPress={() => setSelectedPickupStationId(station.id)}
                        style={[
                          styles.addressCard,
                          selected && styles.addressCardSelected,
                        ]}
                      >
                        <View style={styles.addressHeader}>
                          <Text style={styles.addressTitle}>
                            {station.name}
                          </Text>
                          {selected ? (
                            <View style={styles.selectedBadge}>
                              <Text style={styles.selectedBadgeText}>
                                Selected
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <View style={styles.addressDetails}>
                          <Text style={styles.cardText}>
                            {station.area}, {station.city}
                          </Text>
                          <Text style={styles.cardText}>{station.address}</Text>
                          <Text style={styles.cardText}>
                            Pickup fee: {money(Number(station.fee || 0))}
                          </Text>
                          {!!station.opening_hours && (
                            <Text style={styles.cardText}>
                              Hours: {station.opening_hours}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <EmptyState
                  title="No pickup stations"
                  subtitle="Pickup stations are not available right now for this store."
                />
              )
            ) : (
              <Text style={styles.helperText}>
                Home delivery uses your selected address.
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <StepHeader eyebrow="PAYMENT" title="Payment" />

            {cashOption ? (
              <Pressable
                onPress={() => setPaymentProvider(cashOption.value)}
                style={[
                  styles.paymentOptionCard,
                  paymentProvider === cashOption.value &&
                    styles.paymentOptionCardSelected,
                ]}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={styles.paymentIconCircle}>
                    <Text style={styles.paymentIconText}>₵</Text>
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
                </View>

                <View style={styles.paymentRadio}>
                  {paymentProvider === cashOption.value && (
                    <View style={styles.paymentRadioInner} />
                  )}
                </View>
              </Pressable>
            ) : null}

            <View style={styles.iconPaymentRow}>
              {digitalPaymentOptions.map((option) => {
                const selected = paymentProvider === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      setPaymentProvider(option.value);
                    }}
                    style={[
                      styles.iconPaymentCard,
                      selected && styles.iconPaymentCardSelected,
                    ]}
                  >
                    <View style={styles.iconPaymentTop}>
                      {option.value === "MTN" ? (
                        <Image
                          source={PAYMENT_ICONS.MTN}
                          style={styles.smallPaymentIcon}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.cardPaymentIcon}>
                          <Ionicons
                            name="card-outline"
                            size={24}
                            color={colors.primary}
                          />
                        </View>
                      )}

                      <View style={styles.paymentRadio}>
                        {selected && <View style={styles.paymentRadioInner} />}
                      </View>
                    </View>
                      
                  </Pressable>
                );
              })}
            </View>

            {paymentProvider === "MTN" ? (
              <View style={styles.mtnPhoneCard}>
                <Text style={styles.sectionLabel}>MTN Mobile Money number</Text>
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
                  Use the number that will approve the MTN prompt.
                </Text>
              </View>
            ) : null}

            {paymentProvider === "CARD" ? (
              <View style={styles.cardPaymentForm}>
                <View style={styles.cardPaymentHeader}>
                  <View style={styles.cardPaymentIconSmall}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={16}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionLabel}>Secure card payment</Text>
                    <Text style={styles.helperText}>
                      Full card number and CVV are validated only for this
                      session and are never saved.
                    </Text>
                  </View>
                </View>

                <TextInput
                  placeholder="Cardholder name"
                  placeholderTextColor={colors.muted}
                  value={cardForm.cardholderName}
                  onChangeText={(value) =>
                    setCardForm((prev) => ({ ...prev, cardholderName: value }))
                  }
                  style={styles.input}
                  editable={!isBusy}
                />
                {cardErrors.cardholderName ? (
                  <Text style={styles.fieldError}>
                    {cardErrors.cardholderName}
                  </Text>
                ) : null}

                <TextInput
                  placeholder="Card number"
                  placeholderTextColor={colors.muted}
                  value={formatCardNumber(cardForm.cardNumber)}
                  onChangeText={(value) =>
                    setCardForm((prev) => ({
                      ...prev,
                      cardNumber: normalizeCardNumber(value),
                    }))
                  }
                  keyboardType="number-pad"
                  textContentType="creditCardNumber"
                  style={styles.input}
                  editable={!isBusy}
                />
                {cardErrors.cardNumber ? (
                  <Text style={styles.fieldError}>{cardErrors.cardNumber}</Text>
                ) : null}

                <View style={styles.cardInlineFields}>
                  <View style={styles.cardInlineField}>
                    <TextInput
                      placeholder="MM"
                      placeholderTextColor={colors.muted}
                      value={cardForm.expiryMonth}
                      onChangeText={(value) =>
                        setCardForm((prev) => ({
                          ...prev,
                          expiryMonth: value.replace(/\D/g, "").slice(0, 2),
                        }))
                      }
                      keyboardType="number-pad"
                      style={styles.input}
                      editable={!isBusy}
                    />
                    {cardErrors.expiryMonth ? (
                      <Text style={styles.fieldError}>
                        {cardErrors.expiryMonth}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.cardInlineField}>
                    <TextInput
                      placeholder="YYYY"
                      placeholderTextColor={colors.muted}
                      value={cardForm.expiryYear}
                      onChangeText={(value) =>
                        setCardForm((prev) => ({
                          ...prev,
                          expiryYear: value.replace(/\D/g, "").slice(0, 4),
                        }))
                      }
                      keyboardType="number-pad"
                      style={styles.input}
                      editable={!isBusy}
                    />
                    {cardErrors.expiryYear ? (
                      <Text style={styles.fieldError}>
                        {cardErrors.expiryYear}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.cardInlineField}>
                    <TextInput
                      placeholder="CVV"
                      placeholderTextColor={colors.muted}
                      value={cardForm.cvv}
                      onChangeText={(value) =>
                        setCardForm((prev) => ({
                          ...prev,
                          cvv: value.replace(/\D/g, "").slice(0, 4),
                        }))
                      }
                      keyboardType="number-pad"
                      secureTextEntry
                      style={styles.input}
                      editable={!isBusy}
                    />
                    {cardErrors.cvv ? (
                      <Text style={styles.fieldError}>{cardErrors.cvv}</Text>
                    ) : null}
                  </View>
                </View>

                <TextInput
                  placeholder="Billing email"
                  placeholderTextColor={colors.muted}
                  value={cardForm.billingEmail}
                  onChangeText={(value) =>
                    setCardForm((prev) => ({ ...prev, billingEmail: value }))
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  editable={!isBusy}
                />
                {cardErrors.billingEmail ? (
                  <Text style={styles.fieldError}>
                    {cardErrors.billingEmail}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <StepHeader eyebrow="REVIEW" title="Order summary" />

            {!cartItems.length ? (
              <EmptyState
                title="Your cart is empty"
                subtitle="Add products to your cart before placing an order."
              />
            ) : null}

            {cartItems.map((item) => {
              const itemTotal = getCartItemTotal(item);

              return (
                <View key={item.id} style={styles.summaryItemCard}>
                  <View style={styles.itemInfo}>
                    <Text numberOfLines={2} style={styles.itemText}>
                      {item.product.title}
                    </Text>
                    <Text style={styles.itemMeta}>
                      Qty {item.quantity}
                      {item.variant?.name ? ` • ${item.variant.name}` : ""}
                    </Text>
                  </View>

                  <Text style={styles.price}>{money(itemTotal)}</Text>
                </View>
              );
            })}

            <View style={styles.summaryMeta}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Items subtotal</Text>
                <Text style={styles.metaValue}>{money(itemsSubtotal)}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Delivery fee</Text>
                <Text style={styles.metaValue}>
                  {summaryLoading
                    ? "Calculating..."
                    : friendlySummaryError
                      ? "Unavailable"
                      : money(shippingFee)}
                </Text>
              </View>

              {discountAmount > 0 ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Discount</Text>
                  <Text style={styles.discountValue}>
                    -{money(discountAmount)}
                  </Text>
                </View>
              ) : null}

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Delivery</Text>
                <Text style={styles.metaValue}>
                  {selectedAddress?.city || "Not selected"}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Delivery option</Text>
                <Text style={styles.metaValue}>
                  {deliveryOption === "PICKUP_STATION"
                    ? "Pickup station"
                    : "Home delivery"}
                </Text>
              </View>

              {deliveryOption === "PICKUP_STATION" ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Pickup station</Text>
                  <Text style={styles.metaValue}>
                    {selectedPickupStation?.name || "Not selected"}
                  </Text>
                </View>
              ) : null}

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Payment</Text>
                <Text style={styles.metaValue}>{paymentLabel}</Text>
              </View>
            </View>

            <View style={styles.couponBox}>
              <View style={styles.couponInputRow}>
                <TextInput
                  value={couponCode}
                  onChangeText={setCouponCode}
                  placeholder="Coupon code"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                  editable={!isBusy && !applyingCoupon && !appliedCouponCode}
                  style={styles.couponInput}
                />
                {appliedCouponCode ? (
                  <Pressable
                    onPress={removeCoupon}
                    style={styles.couponButtonMuted}
                  >
                    <Text style={styles.couponButtonMutedText}>Remove</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={applyCoupon}
                    disabled={applyingCoupon || isBusy}
                    style={[
                      styles.couponButton,
                      (applyingCoupon || isBusy) && styles.buttonDisabled,
                    ]}
                  >
                    <Text style={styles.couponButtonText}>
                      {applyingCoupon ? "Checking..." : "Apply"}
                    </Text>
                  </Pressable>
                )}
              </View>
              {appliedCouponCode ? (
                <Text style={styles.couponSuccess}>
                  Coupon {appliedCouponCode} applied.
                </Text>
              ) : couponError ? (
                <Text style={styles.couponError}>{couponError}</Text>
              ) : null}
            </View>

            {friendlySummaryError ? (
              <View style={styles.checkoutWarning}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={colors.warning}
                />
                <Text style={styles.checkoutWarningText}>
                  {friendlySummaryError}
                </Text>
              </View>
            ) : null}

            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>
                {summaryLoading ? "Updating total" : "Order total"}
              </Text>
              <Text style={styles.totalValue}>
                {summaryLoading ? "..." : money(total)}
              </Text>
            </View>
            <Text style={styles.helperText}>
              {checkoutSummary?.estimated_days != null
                ? `Estimated delivery: ${
                    checkoutSummary.estimated_days <= 0
                      ? "Same day"
                      : `${checkoutSummary.estimated_days} day${
                          checkoutSummary.estimated_days === 1 ? "" : "s"
                        }`
                  }.`
                : "Totals are confirmed before checkout."}
            </Text>
          </View>

          <View
            style={[
              styles.checkoutStatus,
              friendlySummaryError && styles.checkoutStatusWarning,
            ]}
          >
            <Ionicons
              name={
                friendlySummaryError
                  ? "warning-outline"
                  : "shield-checkmark-outline"
              }
              size={20}
              color={friendlySummaryError ? colors.warning : colors.primary}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.checkoutStatusTitle}>
                {!cartItems.length
                  ? "Add items to continue"
                  : !selectedAddressId
                    ? "Select a delivery address"
                    : summaryLoading
                      ? "Refreshing checkout total"
                      : friendlySummaryError
                        ? "Action needed before checkout"
                        : "Ready to place your order"}
              </Text>
              <Text style={styles.checkoutStatusText}>
                {friendlySummaryError ||
                  (paymentProvider === "MTN"
                    ? "You will confirm the MTN Mobile Money prompt on your phone."
                    : paymentProvider === "CARD"
                      ? "Card payment will be handled by the configured secure gateway."
                      : "Delivery, address, and payment details are lined up.")}
              </Text>
            </View>
          </View>

          <View style={styles.ctaCard}>
            <View style={styles.ctaSummaryRow}>
              <Text style={styles.ctaLabel}>Total</Text>
              <Text style={styles.ctaTotal}>
                {summaryLoading ? "..." : money(total)}
              </Text>
            </View>

            <Pressable
              style={[
                styles.button,
                isPlaceOrderDisabled && styles.buttonDisabled,
              ]}
              onPress={onPlaceOrder}
              disabled={isPlaceOrderDisabled}
            >
              <Text style={styles.buttonText}>{orderButtonLabel}</Text>
            </Pressable>
          </View>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl + 72,
    backgroundColor: "#F8FAFC",
  },

  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#064E3B",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  heroCardCompact: {
    padding: spacing.md,
    borderRadius: 24,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  heroStatsGrid: {
    flexDirection: "row",
    gap: 8,
  },

  heroStatCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 12,
  },

  heroStatLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: colors.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  heroStatValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "900",
    color: colors.text,
  },

  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  heroIconText: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "900",
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 6,
  },

  heroTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: colors.text,
  },

  heroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  ctaCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    padding: spacing.md,
    gap: 12,
    shadowColor: "#064E3B",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  ctaSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  ctaLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.muted,
  },

  ctaTotal: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  sectionTitleBlock: {
    gap: 4,
  },

  title: {
    fontSize: 19,
    fontWeight: "900",
    color: colors.text,
  },

  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },

  linkPill: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  linkPillText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },

  addressList: {
    gap: spacing.sm,
  },

  addressCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: spacing.md,
    gap: 8,
  },

  addressCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },

  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },

  addressTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    flex: 1,
  },

  addressBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  defaultBadge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  defaultBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },

  selectedBadge: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  selectedBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },

  expandBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  expandBtnText: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.primary,
    lineHeight: 20,
  },

  addressDetails: {
    gap: 4,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },

  secondaryButton: {
    marginTop: spacing.xs,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  secondaryButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },

  paymentOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: spacing.md,
  },

  paymentOptionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },

  paymentOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  paymentIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },

  paymentIconText: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.primary,
  },

  paymentRadio: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  paymentRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },

  paymentLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },

  paymentLabelSelected: {
    color: colors.primary,
  },

  paymentSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },

  iconPaymentRow: {
    flexDirection: "row",
    gap: 10,
  },

  iconPaymentCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 72,
    justifyContent: "center",
  },

  iconPaymentCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },

  disabledPaymentCard: {
    opacity: 0.65,
  },

  iconPaymentTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  smallPaymentIcon: {
    width: 64,
    height: 28,
  },

  cardPaymentIcon: {
    width: 48,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  iconPaymentLabel: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },

  iconPaymentLabelSelected: {
    color: colors.primary,
  },

  comingSoonBadge: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: "800",
    color: colors.muted,
  },

  mtnPhoneCard: {
    gap: 8,
    borderWidth: 1,
    borderColor: "#FCD34D",
    backgroundColor: "#FFFBEB",
    borderRadius: 18,
    padding: spacing.md,
  },

  cardPaymentForm: {
    gap: 10,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    backgroundColor: "#F0FDF4",
    borderRadius: 18,
    padding: spacing.md,
  },

  cardPaymentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },

  cardPaymentIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  cardInlineFields: {
    flexDirection: "row",
    gap: 8,
  },

  cardInlineField: {
    flex: 1,
    minWidth: 0,
  },

  fieldError: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: "800",
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },

  helperText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },

  checkoutWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FCD34D",
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: spacing.md,
  },

  checkoutWarningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#92400E",
    fontWeight: "700",
  },

  couponBox: {
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: spacing.md,
  },

  couponInputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    color: colors.text,
  },

  couponButton: {
    borderRadius: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  couponButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "900",
  },

  couponButtonMuted: {
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  couponButtonMutedText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
  },

  couponSuccess: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "800",
  },

  couponError: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "800",
  },

  inlineLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: spacing.md,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
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
    flexDirection: "row",
    flexWrap: "wrap",
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
    fontWeight: "700",
    color: colors.text,
  },

  regionChipTextActive: {
    color: colors.primary,
  },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  switchLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
    padding: spacing.md,
  },

  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: spacing.md,
    maxHeight: "92%",
    gap: 14,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
  },

  form: {
    gap: 12,
    paddingBottom: 8,
  },

  modalActions: {
    flexDirection: "row",
    gap: 12,
  },

  actionBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelBtn: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: colors.border,
  },

  cancelBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },

  saveBtn: {
    backgroundColor: colors.primary,
  },

  saveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  summaryItemCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: spacing.md,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  itemInfo: {
    flex: 1,
    gap: 4,
  },

  itemText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },

  itemMeta: {
    fontSize: 12,
    color: colors.muted,
  },

  price: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },

  summaryMeta: {
    marginTop: 4,
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  metaLabel: {
    fontSize: 13,
    color: colors.muted,
  },

  metaValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    textAlign: "right",
  },

  discountValue: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.success,
    flex: 1,
    textAlign: "right",
  },

  totalBox: {
    marginTop: 6,
    borderRadius: 18,
    backgroundColor: "#F0FDF4",
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
  },

  totalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.primary,
  },

  button: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },

  checkoutStatus: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },

  checkoutStatusWarning: {
    borderColor: "#FCD34D",
    backgroundColor: "#FFFBEB",
  },

  checkoutStatusTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.text,
  },

  checkoutStatusText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
});
