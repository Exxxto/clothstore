import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, CreditCard, Check, Sparkles, ShieldCheck, Truck, UserRound, MapPin } from "lucide-react";
import { toast } from "sonner";
import CheckoutHeader from "../components/header/CheckoutHeader";
import Footer from "../components/footer/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatPrice } from "@/data/products";
import {
  apiCheckout,
  apiGetAccountProfile,
  apiGetCheckoutOptions,
  apiValidatePromoCode,
  type StoreAddress,
  type StorePaymentMethod,
  type StoreShippingMethod,
  type StoreSavedCard,
} from "@/lib/storeApi";
import { useCart } from "@/hooks/useCart";

const manualAddressValue = "manual";
const manualCardValue = "manual";

const fallbackShippingMethods: StoreShippingMethod[] = [
  {
    id: 0,
    code: "standard",
    name: "Стандартная доставка",
    description: "3-5 рабочих дней",
    price: 0,
    sort_order: 10,
  },
  {
    id: 0,
    code: "express",
    name: "Экспресс-доставка",
    description: "1-2 рабочих дня",
    price: 700,
    sort_order: 20,
  },
  {
    id: 0,
    code: "overnight",
    name: "Доставка на следующий день",
    description: "На следующий рабочий день",
    price: 1500,
    sort_order: 30,
  },
];

const fallbackPaymentMethods: StorePaymentMethod[] = [
  {
    id: 0,
    code: "card",
    name: "Банковская карта",
    description: "Онлайн-оплата картой на сайте",
    requires_card: true,
    sort_order: 10,
  },
  {
    id: 0,
    code: "cash_on_delivery",
    name: "Картой при получении",
    description: "Оплата курьеру или в пункте выдачи",
    requires_card: false,
    sort_order: 20,
  },
];

function formatSavedAddress(address: StoreAddress) {
  return [address.address_line1, address.address_line2, address.city, address.postal_code, address.country].filter(Boolean).join(", ");
}

function splitAddressCustomerName(customerName: string) {
  const parts = customerName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    lastName: parts[0],
    firstName: parts.slice(1).join(" "),
  };
}

function getCheckoutTestRunId() {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get("test_run_id")?.trim() || "";
}

const Checkout = () => {
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount_amount: number } | null>(null);
  const [customerDetails, setCustomerDetails] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: ""
  });
  const [shippingAddress, setShippingAddress] = useState({
    address: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: ""
  });
  const [savedAddresses, setSavedAddresses] = useState<StoreAddress[]>([]);
  const [savedCards, setSavedCards] = useState<StoreSavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState(manualCardValue);
  const [selectedAddressId, setSelectedAddressId] = useState(manualAddressValue);
  const [saveShippingAddress, setSaveShippingAddress] = useState(true);
  const [hasSeparateBilling, setHasSeparateBilling] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: ""
  });
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState(manualAddressValue);
  const [saveBillingAddress, setSaveBillingAddress] = useState(false);
  const [shippingOption, setShippingOption] = useState("standard");
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [shippingMethods, setShippingMethods] = useState<StoreShippingMethod[]>(fallbackShippingMethods);
  const [paymentMethods, setPaymentMethods] = useState<StorePaymentMethod[]>(fallbackPaymentMethods);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<{ order_id: number; total_amount: number } | null>(null);
  const { cartItems, subtotal, updateQuantity, refreshCart } = useCart();

  const applySavedAddress = (address: StoreAddress, overwriteCustomer = false) => {
    const name = splitAddressCustomerName(address.customer_name);

    setShippingAddress({
      address: address.address_line1,
      addressLine2: address.address_line2 || "",
      city: address.city || "",
      postalCode: address.postal_code || "",
      country: address.country || "",
    });

    setCustomerDetails((current) => ({
      email: overwriteCustomer ? address.email || current.email : current.email || address.email || "",
      firstName: overwriteCustomer ? name.firstName || current.firstName : current.firstName || name.firstName,
      lastName: overwriteCustomer ? name.lastName || current.lastName : current.lastName || name.lastName,
      phone: overwriteCustomer ? address.phone || current.phone : current.phone || address.phone || "",
    }));
  };

  const applySavedBillingAddress = (address: StoreAddress) => {
    const name = splitAddressCustomerName(address.customer_name);

    setBillingDetails({
      email: address.email || customerDetails.email,
      firstName: name.firstName || customerDetails.firstName,
      lastName: name.lastName || customerDetails.lastName,
      phone: address.phone || customerDetails.phone,
      address: address.address_line1,
      addressLine2: address.address_line2 || "",
      city: address.city || "",
      postalCode: address.postal_code || "",
      country: address.country || "",
    });
  };

  useEffect(() => {
    let active = true;

    Promise.all([apiGetCheckoutOptions(), apiGetAccountProfile()])
      .then(([options, account]) => {
        if (!active) return;

        const nextShippingMethods = options.shipping_methods.length > 0 ? options.shipping_methods : fallbackShippingMethods;
        const nextPaymentMethods = options.payment_methods.length > 0 ? options.payment_methods : fallbackPaymentMethods;

        setShippingMethods(nextShippingMethods);
        setPaymentMethods(nextPaymentMethods);

        if (!nextShippingMethods.some((method) => method.code === shippingOption)) {
          setShippingOption(nextShippingMethods[0]?.code ?? "standard");
        }

        if (!nextPaymentMethods.some((method) => method.code === paymentMethod)) {
          setPaymentMethod(nextPaymentMethods[0]?.code ?? "card");
        }

        const profile = account.profile;
        setSavedAddresses(account.addresses);
        setSavedCards(profile.saved_cards ?? []);
        setCustomerDetails((current) => ({
          email: current.email || profile.email || "",
          firstName: current.firstName || profile.first_name || "",
          lastName: current.lastName || profile.last_name || "",
          phone: current.phone || profile.phone || "",
        }));

        const defaultAddress = account.addresses.find((address) => address.is_default) ?? account.addresses[0];
        if (defaultAddress) {
          setSelectedAddressId(String(defaultAddress.id));
          applySavedAddress(defaultAddress);
        }

        const defaultCard = (profile.saved_cards ?? []).find((c) => c.is_default) ?? (profile.saved_cards ?? [])[0];
        if (defaultCard) {
          setSelectedCardId(defaultCard.id);
        }
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Не удалось загрузить параметры оформления");
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedShippingMethod = useMemo(
    () => shippingMethods.find((method) => method.code === shippingOption) ?? shippingMethods[0] ?? fallbackShippingMethods[0],
    [shippingMethods, shippingOption],
  );

  const selectedPaymentMethod = useMemo(
    () => paymentMethods.find((method) => method.code === paymentMethod) ?? paymentMethods[0] ?? fallbackPaymentMethods[0],
    [paymentMethods, paymentMethod],
  );
  
  const hasActiveCart = cartItems.length > 0 && !paymentComplete;
  const shipping = hasActiveCart ? selectedShippingMethod.price : 0;
  const discountAmount = hasActiveCart ? appliedPromo?.discount_amount || 0 : 0;
  const total = Math.max(subtotal - discountAmount, 0) + shipping;
  const cardPaymentRequired = selectedPaymentMethod.requires_card;

  const handleDiscountSubmit = async () => {
    if (!discountCode.trim()) {
      setAppliedPromo(null);
      setShowDiscountInput(false);
      return;
    }

    try {
      const promo = await apiValidatePromoCode(discountCode.trim(), subtotal);
      setAppliedPromo({ code: promo.code, discount_amount: promo.discount_amount });
      setShowDiscountInput(false);
    } catch {
      setAppliedPromo(null);
    }
  };

  const handleCustomerDetailsChange = (field: string, value: string) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleShippingAddressChange = (field: string, value: string) => {
    setSelectedAddressId(manualAddressValue);
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleSavedAddressChange = (value: string) => {
    setSelectedAddressId(value);

    if (value === manualAddressValue) {
      return;
    }

    const address = savedAddresses.find((item) => String(item.id) === value);
    if (address) {
      applySavedAddress(address, true);
    }
  };

  const handleBillingDetailsChange = (field: string, value: string) => {
    setSelectedBillingAddressId(manualAddressValue);
    setBillingDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleBillingAddressChange = (value: string) => {
    setSelectedBillingAddressId(value);

    if (value === manualAddressValue) {
      return;
    }

    const address = savedAddresses.find((item) => String(item.id) === value);
    if (address) {
      applySavedBillingAddress(address);
    }
  };

  const handlePaymentDetailsChange = (field: string, value: string) => {
    setPaymentDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleSavedCardChange = (value: string) => {
    setSelectedCardId(value);
    if (value !== manualCardValue) {
      // Clear manual card fields when a saved card is selected
      setPaymentDetails({ cardNumber: "", expiryDate: "", cvv: "", cardholderName: "" });
    }
  };

  const validateCheckoutForm = () => {
    if (!customerDetails.email.trim() || !customerDetails.firstName.trim() || !customerDetails.lastName.trim()) {
      toast.error("Заполните email, имя и фамилию покупателя");
      return false;
    }

    if (!shippingAddress.address.trim() || !shippingAddress.city.trim() || !shippingAddress.postalCode.trim() || !shippingAddress.country.trim()) {
      toast.error("Заполните полный адрес доставки");
      return false;
    }

    if (
      hasSeparateBilling &&
      (!billingDetails.address.trim() || !billingDetails.city.trim() || !billingDetails.postalCode.trim() || !billingDetails.country.trim())
    ) {
      toast.error("Заполните полный адрес для счёта");
      return false;
    }

    if (
      cardPaymentRequired &&
      selectedCardId === manualCardValue &&
      (!paymentDetails.cardNumber.trim() ||
        !paymentDetails.expiryDate.trim() ||
        !paymentDetails.cvv.trim() ||
        !paymentDetails.cardholderName.trim())
    ) {
      toast.error("Заполните данные карты или выберите сохранённую карту");
      return false;
    }

    return true;
  };

  const handleCompleteOrder = async () => {
    if (!validateCheckoutForm()) {
      return;
    }

    const testRunId = getCheckoutTestRunId();
    setIsProcessing(true);

    try {
      const result = await apiCheckout({
        customer: {
          email: customerDetails.email,
          first_name: customerDetails.firstName,
          last_name: customerDetails.lastName,
          phone: customerDetails.phone,
        },
        shipping_address: {
          address_line1: shippingAddress.address,
          address_line2: shippingAddress.addressLine2 || undefined,
          city: shippingAddress.city,
          postal_code: shippingAddress.postalCode,
          country: shippingAddress.country,
        },
        shipping_address_id: selectedAddressId === manualAddressValue ? null : Number(selectedAddressId),
        save_shipping_address: selectedAddressId === manualAddressValue ? saveShippingAddress : true,
        billing_address: hasSeparateBilling
          ? {
              email: billingDetails.email,
              phone: billingDetails.phone,
              address_line1: billingDetails.address,
              address_line2: billingDetails.addressLine2 || undefined,
              city: billingDetails.city,
              postal_code: billingDetails.postalCode,
              country: billingDetails.country,
            }
          : null,
        billing_address_id: hasSeparateBilling && selectedBillingAddressId !== manualAddressValue ? Number(selectedBillingAddressId) : null,
        save_billing_address: hasSeparateBilling && selectedBillingAddressId === manualAddressValue ? saveBillingAddress : false,
        shipping_option: selectedShippingMethod.code,
        payment_method: selectedPaymentMethod.code,
        promo_code: appliedPromo?.code || null,
        is_test: Boolean(testRunId),
        test_run_id: testRunId || null,
        source: testRunId ? "e2e" : "storefront",
      });

      setCheckoutResult({ order_id: result.order_id, total_amount: result.total_amount });
      setPaymentComplete(true);
      setAppliedPromo(null);
      setDiscountCode("");
      await refreshCart();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось оформить заказ");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <CheckoutHeader />

      <main className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.06),transparent_30%),radial-gradient(circle_at_top_right,rgba(0,0,0,0.05),transparent_25%),linear-gradient(to_bottom,rgba(255,255,255,0.92),rgba(247,247,245,1))]" />
        <div className="max-w-7xl mx-auto px-6 py-10 lg:py-14">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles size={14} strokeWidth={1.75} />
              Оформление
            </div>
            <div className="mt-5 max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-light tracking-tight text-foreground">
                Оформление заказа как серия аккуратных карточек, без визуального шума.
              </h1>
              <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-2xl">
                Вся форма разделена на понятные блоки: данные покупателя, доставка, оплата и сводка заказа.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-8 items-start">
            <div className="space-y-6">
              <Card className="border-border/70 shadow-[0_18px_50px_rgba(0,0,0,0.05)]">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center">
                      <UserRound size={18} strokeWidth={1.6} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-light">Данные покупателя</CardTitle>
                      <CardDescription>Контакты для связи и доставки</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="email" className="text-sm font-light text-foreground">Адрес электронной почты *</Label>
                    <Input id="email" type="email" value={customerDetails.email} onChange={(e) => handleCustomerDetailsChange("email", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Введите email" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-light text-foreground">Имя *</Label>
                      <Input id="firstName" type="text" value={customerDetails.firstName} onChange={(e) => handleCustomerDetailsChange("firstName", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Введите имя" />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-light text-foreground">Фамилия *</Label>
                      <Input id="lastName" type="text" value={customerDetails.lastName} onChange={(e) => handleCustomerDetailsChange("lastName", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Введите фамилию" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-light text-foreground">Номер телефона</Label>
                    <Input id="phone" type="tel" value={customerDetails.phone} onChange={(e) => handleCustomerDetailsChange("phone", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Введите номер телефона" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-[0_18px_50px_rgba(0,0,0,0.05)]">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center">
                      <Truck size={18} strokeWidth={1.6} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-light">Доставка</CardTitle>
                      <CardDescription>Укажите адрес и способ доставки</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {savedAddresses.length > 0 ? (
                    <div className="rounded-2xl border border-border bg-background/60 p-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full border border-border p-2">
                          <MapPin size={16} strokeWidth={1.6} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">Сохранённые адреса</div>
                          <div className="text-xs text-muted-foreground">Выберите адрес из личного кабинета или введите новый.</div>
                        </div>
                      </div>

                      <RadioGroup value={selectedAddressId} onValueChange={handleSavedAddressChange} className="grid gap-3">
                        {savedAddresses.map((address) => (
                          <label
                            key={address.id}
                            className="flex items-start gap-3 rounded-2xl border border-border bg-background/70 p-4 cursor-pointer hover:border-foreground/30 transition-colors"
                          >
                            <RadioGroupItem value={String(address.id)} id={`saved_address_${address.id}`} className="mt-1" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-foreground">
                                  {address.label || "Адрес доставки"}
                                </span>
                                {address.is_default ? (
                                  <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-background">
                                    По умолчанию
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">{formatSavedAddress(address)}</div>
                              {address.customer_name ? (
                                <div className="mt-1 text-xs text-muted-foreground">{address.customer_name}</div>
                              ) : null}
                            </div>
                          </label>
                        ))}

                        <label className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-background/50 p-4 cursor-pointer hover:border-foreground/30 transition-colors">
                          <RadioGroupItem value={manualAddressValue} id="saved_address_manual" />
                          <span className="text-sm text-foreground">Ввести новый адрес вручную</span>
                        </label>
                      </RadioGroup>
                    </div>
                  ) : null}

                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="shippingAddress" className="text-sm font-light text-foreground">Адрес *</Label>
                      <Input id="shippingAddress" type="text" value={shippingAddress.address} onChange={(e) => handleShippingAddressChange("address", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Улица, дом, квартира" />
                    </div>
                    <div>
                      <Label htmlFor="shippingAddressLine2" className="text-sm font-light text-foreground">Дополнение</Label>
                      <Input id="shippingAddressLine2" type="text" value={shippingAddress.addressLine2} onChange={(e) => handleShippingAddressChange("addressLine2", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Подъезд, этаж, домофон" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="shippingCity" className="text-sm font-light text-foreground">Город *</Label>
                        <Input id="shippingCity" type="text" value={shippingAddress.city} onChange={(e) => handleShippingAddressChange("city", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Город" />
                      </div>
                      <div>
                        <Label htmlFor="shippingPostalCode" className="text-sm font-light text-foreground">Почтовый индекс *</Label>
                        <Input id="shippingPostalCode" type="text" value={shippingAddress.postalCode} onChange={(e) => handleShippingAddressChange("postalCode", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Индекс" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="shippingCountry" className="text-sm font-light text-foreground">Страна *</Label>
                      <Input id="shippingCountry" type="text" value={shippingAddress.country} onChange={(e) => handleShippingAddressChange("country", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Страна" />
                    </div>
                  </div>

                  {selectedAddressId === manualAddressValue ? (
                    <div className="rounded-2xl border border-border bg-background/60 p-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="saveShippingAddress"
                          checked={saveShippingAddress}
                          onCheckedChange={(checked) => setSaveShippingAddress(checked === true)}
                        />
                        <Label htmlFor="saveShippingAddress" className="text-sm font-light text-foreground cursor-pointer">
                          Сохранить этот адрес в личном кабинете
                        </Label>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
                      При оформлении выбранный адрес станет адресом по умолчанию без создания дубля.
                    </div>
                  )}

                  <div className="rounded-2xl border border-border bg-background/60 p-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="separateBilling" checked={hasSeparateBilling} onCheckedChange={(checked) => setHasSeparateBilling(checked === true)} />
                      <Label htmlFor="separateBilling" className="text-sm font-light text-foreground cursor-pointer">Другой адрес для выставления счета</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {hasSeparateBilling && (
                <Card className="border-border/70 shadow-[0_18px_50px_rgba(0,0,0,0.05)]">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-light">Платёжные данные</CardTitle>
                    <CardDescription>Дополнительный блок для отдельного счёта</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {savedAddresses.length > 0 ? (
                      <div className="rounded-2xl border border-border bg-background/60 p-4 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-full border border-border p-2">
                            <MapPin size={16} strokeWidth={1.6} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">Адрес для счёта</div>
                            <div className="text-xs text-muted-foreground">Можно выбрать сохранённый адрес или заполнить отдельный вручную.</div>
                          </div>
                        </div>

                        <RadioGroup value={selectedBillingAddressId} onValueChange={handleBillingAddressChange} className="grid gap-3">
                          {savedAddresses.map((address) => (
                            <label
                              key={address.id}
                              className="flex items-start gap-3 rounded-2xl border border-border bg-background/70 p-4 cursor-pointer hover:border-foreground/30 transition-colors"
                            >
                              <RadioGroupItem value={String(address.id)} id={`billing_address_${address.id}`} className="mt-1" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-foreground">{address.label || "Сохранённый адрес"}</div>
                                <div className="mt-1 text-xs text-muted-foreground">{formatSavedAddress(address)}</div>
                              </div>
                            </label>
                          ))}

                          <label className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-background/50 p-4 cursor-pointer hover:border-foreground/30 transition-colors">
                            <RadioGroupItem value={manualAddressValue} id="billing_address_manual" />
                            <span className="text-sm text-foreground">Ввести адрес для счёта вручную</span>
                          </label>
                        </RadioGroup>
                      </div>
                    ) : null}

                    <div>
                      <Label htmlFor="billingEmail" className="text-sm font-light text-foreground">Адрес электронной почты *</Label>
                      <Input id="billingEmail" type="email" value={billingDetails.email} onChange={(e) => handleBillingDetailsChange("email", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Введите email для счёта" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billingFirstName" className="text-sm font-light text-foreground">Имя *</Label>
                        <Input id="billingFirstName" type="text" value={billingDetails.firstName} onChange={(e) => handleBillingDetailsChange("firstName", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Введите имя" />
                      </div>
                      <div>
                        <Label htmlFor="billingLastName" className="text-sm font-light text-foreground">Фамилия *</Label>
                        <Input id="billingLastName" type="text" value={billingDetails.lastName} onChange={(e) => handleBillingDetailsChange("lastName", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Введите фамилию" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="billingPhone" className="text-sm font-light text-foreground">Номер телефона</Label>
                      <Input id="billingPhone" type="tel" value={billingDetails.phone} onChange={(e) => handleBillingDetailsChange("phone", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Введите номер телефона" />
                    </div>
                    <div>
                      <Label htmlFor="billingAddress" className="text-sm font-light text-foreground">Адрес *</Label>
                      <Input id="billingAddress" type="text" value={billingDetails.address} onChange={(e) => handleBillingDetailsChange("address", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Улица, дом, квартира" />
                    </div>
                    <div>
                      <Label htmlFor="billingAddressLine2" className="text-sm font-light text-foreground">Дополнение</Label>
                      <Input id="billingAddressLine2" type="text" value={billingDetails.addressLine2} onChange={(e) => handleBillingDetailsChange("addressLine2", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Подъезд, этаж, домофон" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billingCity" className="text-sm font-light text-foreground">Город *</Label>
                        <Input id="billingCity" type="text" value={billingDetails.city} onChange={(e) => handleBillingDetailsChange("city", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Город" />
                      </div>
                      <div>
                        <Label htmlFor="billingPostalCode" className="text-sm font-light text-foreground">Почтовый индекс *</Label>
                        <Input id="billingPostalCode" type="text" value={billingDetails.postalCode} onChange={(e) => handleBillingDetailsChange("postalCode", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Индекс" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="billingCountry" className="text-sm font-light text-foreground">Страна *</Label>
                      <Input id="billingCountry" type="text" value={billingDetails.country} onChange={(e) => handleBillingDetailsChange("country", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Страна" />
                    </div>

                    {selectedBillingAddressId === manualAddressValue ? (
                      <div className="rounded-2xl border border-border bg-background/60 p-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="saveBillingAddress"
                            checked={saveBillingAddress}
                            onCheckedChange={(checked) => setSaveBillingAddress(checked === true)}
                          />
                          <Label htmlFor="saveBillingAddress" className="text-sm font-light text-foreground cursor-pointer">
                            Сохранить адрес для счёта в личном кабинете
                          </Label>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
                        Для счёта будет использован выбранный сохранённый адрес без создания дубля.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="border-border/70 shadow-[0_18px_50px_rgba(0,0,0,0.05)]">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center">
                      <ShieldCheck size={18} strokeWidth={1.6} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-light">Способ доставки</CardTitle>
                      <CardDescription>Выберите удобный вариант</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={shippingOption} onValueChange={setShippingOption} className="grid gap-3">
                    {shippingMethods.map((method) => (
                      <label
                        key={method.code}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/70 p-4 cursor-pointer hover:border-foreground/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={method.code} id={`shipping_${method.code}`} />
                          <div>
                            <div className="text-sm font-medium text-foreground">{method.name}</div>
                            {method.description ? (
                              <div className="text-xs text-muted-foreground">{method.description}</div>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {method.price === 0 ? "Бесплатно" : formatPrice(method.price)}
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-[0_18px_50px_rgba(0,0,0,0.05)]">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center">
                      <CreditCard size={18} strokeWidth={1.6} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-light">Платёж</CardTitle>
                      <CardDescription>Выберите способ оплаты и завершите покупку</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!paymentComplete ? (
                    <div className="space-y-6">
                      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid gap-3">
                        {paymentMethods.map((method) => (
                          <label
                            key={method.code}
                            className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/70 p-4 cursor-pointer hover:border-foreground/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value={method.code} id={`payment_${method.code}`} />
                              <div>
                                <div className="text-sm font-medium text-foreground">{method.name}</div>
                                {method.description ? (
                                  <div className="text-xs text-muted-foreground">{method.description}</div>
                                ) : null}
                              </div>
                            </div>
                            {method.requires_card ? (
                              <CreditCard size={16} className="shrink-0 text-muted-foreground" />
                            ) : null}
                          </label>
                        ))}
                      </RadioGroup>

                      {cardPaymentRequired ? (
                        <>
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                            Mock-оплата: эти поля нужны только для тестового сценария. Данные карты не отправляются платёжному провайдеру, а заказ будет отмечен как оплаченный через `mock-card`.
                          </div>

                          {savedCards.length > 0 && (
                            <div className="rounded-2xl border border-border bg-background/60 p-4 space-y-4">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 rounded-full border border-border p-2">
                                  <CreditCard size={16} strokeWidth={1.6} />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-foreground">Сохранённые карты</div>
                                  <div className="text-xs text-muted-foreground">Выберите карту из личного кабинета или введите новую.</div>
                                </div>
                              </div>

                              <RadioGroup value={selectedCardId} onValueChange={handleSavedCardChange} className="grid gap-3">
                                {savedCards.map((card) => (
                                  <label
                                    key={card.id}
                                    className="flex items-start gap-3 rounded-2xl border border-border bg-background/70 p-4 cursor-pointer hover:border-foreground/30 transition-colors"
                                  >
                                    <RadioGroupItem value={card.id} id={`saved_card_${card.id}`} className="mt-1" />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-medium text-foreground">
                                          {card.label || `•••• ${card.last4}`}
                                        </span>
                                        {card.is_default ? (
                                          <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-background">
                                            По умолчанию
                                          </span>
                                        ) : null}
                                      </div>
                                      <div className="mt-1 text-xs text-muted-foreground capitalize">
                                        {card.brand} •••• {card.last4} · до {card.expiry}
                                      </div>
                                      {card.cardholder_name ? (
                                        <div className="mt-0.5 text-xs text-muted-foreground">{card.cardholder_name}</div>
                                      ) : null}
                                    </div>
                                  </label>
                                ))}

                                <label className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-background/50 p-4 cursor-pointer hover:border-foreground/30 transition-colors">
                                  <RadioGroupItem value={manualCardValue} id="saved_card_manual" />
                                  <span className="text-sm text-foreground">Ввести данные карты вручную</span>
                                </label>
                              </RadioGroup>
                            </div>
                          )}

                          {selectedCardId === manualCardValue && (
                            <>
                              <div>
                                <Label htmlFor="cardholderName" className="text-sm font-light text-foreground">Имя держателя карты *</Label>
                                <Input id="cardholderName" type="text" value={paymentDetails.cardholderName} onChange={(e) => handlePaymentDetailsChange("cardholderName", e.target.value)} className="mt-2 rounded-2xl bg-background/70" placeholder="Имя на карте" />
                              </div>
                              <div>
                                <Label htmlFor="cardNumber" className="text-sm font-light text-foreground">Номер карты *</Label>
                                <div className="relative mt-2">
                                  <Input id="cardNumber" type="text" value={paymentDetails.cardNumber} onChange={(e) => { const value = e.target.value.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim(); if (value.length <= 19) handlePaymentDetailsChange("cardNumber", value); }} className="rounded-2xl bg-background/70 pl-10" placeholder="4242 4242 4242 4242" maxLength={19} />
                                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="expiryDate" className="text-sm font-light text-foreground">Срок действия *</Label>
                                  <Input id="expiryDate" type="text" value={paymentDetails.expiryDate} onChange={(e) => { const value = e.target.value.replace(/\D/g, "").replace(/(\d{2})(\d{2})/, "$1/$2"); if (value.length <= 5) handlePaymentDetailsChange("expiryDate", value); }} className="mt-2 rounded-2xl bg-background/70" placeholder="ММ/ГГ" maxLength={5} />
                                </div>
                                <div>
                                  <Label htmlFor="cvv" className="text-sm font-light text-foreground">CVV *</Label>
                                  <Input id="cvv" type="text" value={paymentDetails.cvv} onChange={(e) => { const value = e.target.value.replace(/\D/g, ""); if (value.length <= 3) handlePaymentDetailsChange("cvv", value); }} className="mt-2 rounded-2xl bg-background/70" placeholder="123" maxLength={3} />
                                </div>
                              </div>
                            </>
                          )}

                          {selectedCardId !== manualCardValue && (
                            <div className="rounded-2xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
                              Будет использована выбранная сохранённая карта.
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm text-muted-foreground">
                          Данные карты не нужны: оплата будет проведена при получении заказа.
                        </div>
                      )}

                      <div className="rounded-2xl border border-border bg-gradient-to-br from-background to-muted/40 p-5 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Промежуточный итог</span>
                          <span className="text-foreground">{formatPrice(subtotal)}</span>
                        </div>
                        {appliedPromo && (
                          <div className="flex justify-between text-sm">
                            <span className="text-emerald-600">Промокод {appliedPromo.code}</span>
                            <span className="text-emerald-600">− {formatPrice(appliedPromo.discount_amount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Доставка</span>
                          <span className="text-foreground">{shipping === 0 ? "Бесплатно" : formatPrice(shipping)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-medium border-t border-border pt-3">
                          <span className="text-foreground">Итого</span>
                          <span className="text-foreground">{formatPrice(total)}</span>
                        </div>
                      </div>

                      <Button
                        onClick={handleCompleteOrder}
                        disabled={
                          isProcessing ||
                          cartItems.length === 0 ||
                          (cardPaymentRequired &&
                            selectedCardId === manualCardValue &&
                            (!paymentDetails.cardNumber ||
                              !paymentDetails.expiryDate ||
                              !paymentDetails.cvv ||
                              !paymentDetails.cardholderName))
                        }
                        className="w-full h-12 rounded-2xl text-base shadow-lg shadow-black/10"
                      >
                        {isProcessing ? "Обработка..." : `Оформить заказ • ${formatPrice(total)}`}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Check className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-light text-foreground mb-2">Заказ оформлен!</h3>
                      <p className="text-muted-foreground">
                        Спасибо за покупку. Заказ #{checkoutResult?.order_id} на сумму {checkoutResult ? formatPrice(checkoutResult.total_amount) : formatPrice(total)} оформлен и сохранён.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <aside className="lg:sticky lg:top-6 space-y-6">
              <Card className="border-border/70 shadow-[0_18px_50px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500" />
                <CardHeader className="-mt-10 pb-4">
                  <div className="w-20 h-20 rounded-full border-4 border-background bg-background shadow-md overflow-hidden">
                    <img src={cartItems[0]?.image_url || cartItems[0]?.product?.image || "/placeholder.svg"} alt="Order preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="pt-2">
                    <CardTitle className="text-xl font-light">Сводка заказа</CardTitle>
                    <CardDescription>{cartItems.length} позиции в корзине</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-4">
                    {cartItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-background/70 p-6 text-sm text-muted-foreground">
                        Корзина пока пуста. Добавьте товары из каталога, и они появятся здесь.
                      </div>
                    ) : cartItems.map((item) => (
                      <div key={item.id} className="flex gap-4 rounded-2xl border border-border bg-background/70 p-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                          <img src={item.image_url || item.product?.image || "/placeholder.svg"} alt={item.product_name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-sm font-medium text-foreground truncate">{item.product_name}</h3>
                              {item.size && <p className="text-xs text-muted-foreground mt-1">Размер: {item.size}</p>}
                            </div>
                            <div className="text-sm font-medium text-foreground whitespace-nowrap">{formatPrice(item.unit_price)}</div>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Button variant="outline" size="sm" onClick={() => void updateQuantity(item.id, item.quantity - 1)} className="h-8 w-8 p-0 rounded-full">
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium text-foreground min-w-[2ch] text-center">{item.quantity}</span>
                            <Button variant="outline" size="sm" onClick={() => void updateQuantity(item.id, item.quantity + 1)} className="h-8 w-8 p-0 rounded-full">
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-border bg-background/70 p-4">
                    {!showDiscountInput ? (
                      <button onClick={() => setShowDiscountInput(true)} className="text-sm text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity">
                        Код скидки
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <Input type="text" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="Введите код скидки" className="rounded-2xl bg-background/80" />
                        <button onClick={handleDiscountSubmit} className="text-sm text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity">
                          Применить
                        </button>
                      </div>
                    )}
                    {appliedPromo && (
                      <p className="mt-3 text-sm text-emerald-600">
                        Применён {appliedPromo.code}: скидка {formatPrice(appliedPromo.discount_amount)}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-border bg-gradient-to-br from-zinc-950 to-zinc-700 p-5 text-white">
                    <div className="flex justify-between text-sm text-white/70">
                      <span>Промежуточный итог</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {appliedPromo && (
                      <div className="mt-3 flex justify-between text-sm text-emerald-200">
                        <span>Скидка</span>
                        <span>− {formatPrice(appliedPromo.discount_amount)}</span>
                      </div>
                    )}
                    <div className="mt-3 flex justify-between text-sm text-white/70">
                      <span>Доставка</span>
                      <span>{shipping === 0 ? "Бесплатно" : formatPrice(shipping)}</span>
                    </div>
                    <div className="mt-4 border-t border-white/15 pt-4 flex justify-between items-end">
                      <span className="text-sm uppercase tracking-[0.2em] text-white/60">Итого</span>
                      <span className="text-2xl font-light">{formatPrice(total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
