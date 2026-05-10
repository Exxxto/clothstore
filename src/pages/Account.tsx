import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImageUp,
  Package2,
  Search,
  Trash2,
  Mail,
  Phone,
  ArrowUpDown,
  Heart,
  Home,
  MapPin,
  Pencil,
  Plus,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import type { ChangeEvent } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarCropDialog } from "@/components/ui/AvatarCropDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Header from "@/components/header/Header";
import FavoriteToggleButton from "@/components/product/FavoriteToggleButton";
import { typeLabels, genderLabels, formatPrice } from "@/data/products";
import { normalizeGenderValue } from "@/lib/productNormalization";
import { useFavorites } from "@/hooks/useFavorites";
import {
  apiGetAccountOrders,
  apiGetAccountProfile,
  apiCreateAccountAddress,
  apiDeleteAccountAddress,
  apiSetDefaultAccountAddress,
  apiUpdateAccountProfile,
  apiUpdateAccountAddress,
  type StoreAddress,
  type StoreAddressPayload,
  type StoreOrderSummary,
  type StoreProfile,
} from "@/lib/storeApi";

type UserProfile = StoreProfile;

type UserOrder = StoreOrderSummary & {
  status: "new" | "confirmed" | "packing" | "shipped" | "completed" | "cancelled";
};

type OrderStatusFilter = UserOrder["status"] | "all";
type OrderSort = "newest" | "oldest" | "amount-high" | "amount-low";
type AccountTab = "profile" | "addresses" | "security" | "favorites";
type AddressDraft = {
  label: string;
  customer_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  postal_code: string;
  address_line1: string;
  address_line2: string;
  is_default: boolean;
};

const initialProfile: UserProfile = {
  id: null,
  session_id: "",
  last_name: "",
  first_name: "",
  middle_name: null,
  email: "",
  phone: null,
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const emptyOrderState: Record<UserOrder["status"], number> = {
  new: 0,
  confirmed: 0,
  packing: 0,
  shipped: 0,
  completed: 0,
  cancelled: 0,
};

function resolveAccountTab(value: string | null): AccountTab {
  if (value === "addresses" || value === "security" || value === "favorites") {
    return value;
  }

  return "profile";
}

const statusMeta = {
  new: { label: "Новый", variant: "secondary" as const },
  confirmed: { label: "Подтверждён", variant: "outline" as const },
  packing: { label: "Сборка", variant: "outline" as const },
  shipped: { label: "В пути", variant: "default" as const },
  completed: { label: "Доставлен", variant: "default" as const },
  cancelled: { label: "Отменён", variant: "destructive" as const },
};

const moneyFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const shortDateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

function formatShortDate(value: string) {
  return shortDateTimeFormatter.format(new Date(value));
}

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function getInitials(profile: UserProfile) {
  return `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase();
}

function getFullName(profile: UserProfile) {
  return [profile.last_name, profile.first_name, profile.middle_name].filter(Boolean).join(" ");
}

function createAddressDraft(profile: UserProfile, isDefault = false): AddressDraft {
  return {
    label: "Дом",
    customer_name: getFullName(profile),
    email: profile.email,
    phone: profile.phone ?? "",
    country: "Россия",
    city: "",
    postal_code: "",
    address_line1: "",
    address_line2: "",
    is_default: isDefault,
  };
}

function addressToDraft(address: StoreAddress): AddressDraft {
  return {
    label: address.label ?? "",
    customer_name: address.customer_name,
    email: address.email ?? "",
    phone: address.phone ?? "",
    country: address.country ?? "",
    city: address.city ?? "",
    postal_code: address.postal_code ?? "",
    address_line1: address.address_line1,
    address_line2: address.address_line2 ?? "",
    is_default: address.is_default,
  };
}

function formatAddress(address: StoreAddress) {
  return [address.country, address.city, address.address_line1, address.address_line2, address.postal_code]
    .filter(Boolean)
    .join(", ");
}

function toAddressPayload(draft: AddressDraft): StoreAddressPayload {
  return {
    label: draft.label.trim() || null,
    customer_name: draft.customer_name.trim(),
    email: draft.email.trim() || null,
    phone: draft.phone.trim() || null,
    country: draft.country.trim() || null,
    city: draft.city.trim() || null,
    postal_code: draft.postal_code.trim() || null,
    address_line1: draft.address_line1.trim(),
    address_line2: draft.address_line2.trim() || null,
    is_default: draft.is_default,
  };
}

const Account = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [draft, setDraft] = useState<UserProfile>(initialProfile);
  const [addresses, setAddresses] = useState<StoreAddress[]>([]);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<StoreAddress | null>(null);
  const [addressDraft, setAddressDraft] = useState<AddressDraft>(() => createAddressDraft(initialProfile));
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressBusyId, setAddressBusyId] = useState<number | null>(null);
  const [recentOrders, setRecentOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [securityDraft, setSecurityDraft] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    loginAlerts: true,
    passwordReminders: false,
  });
  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>("all");
  const [orderSort, setOrderSort] = useState<OrderSort>("newest");
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(8);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const { favoriteProducts, favoriteCount, clearFavorites } = useFavorites();

  useEffect(() => {
    let active = true;

    Promise.all([apiGetAccountProfile(), apiGetAccountOrders()])
      .then(([profilePayload, orderRows]) => {
        if (!active) return;
        setProfile(profilePayload.profile);
        setDraft(profilePayload.profile);
        setAddresses(profilePayload.addresses);
        setRecentOrders(orderRows as UserOrder[]);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Не удалось загрузить данные аккаунта");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const fullName = useMemo(() => getFullName(profile), [profile]);
  const initials = useMemo(() => getInitials(profile), [profile]);
  const draftFullName = useMemo(() => getFullName(draft), [draft]);
  const draftInitials = useMemo(() => getInitials(draft), [draft]);
  const activeTab = resolveAccountTab(searchParams.get("tab"));
  const defaultAddress = useMemo(() => addresses.find((address) => address.is_default) ?? null, [addresses]);
  const deliveredOrders = useMemo(
    () => recentOrders.filter((order) => order.status === "completed").length,
    [recentOrders],
  );

  const orderStatusCounts = useMemo(
    () =>
      recentOrders.reduce(
        (acc, order) => {
          acc[order.status] += 1;
          return acc;
        },
        { ...emptyOrderState },
      ),
    [recentOrders],
  );

  const filteredOrders = useMemo(() => {
    const query = orderQuery.trim().toLowerCase();

    const matched = recentOrders.filter((order) => {
      const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
      const haystack = [
        order.id.toString(),
        order.delivery_method,
        order.payment_method,
        order.delivery_address,
        formatMoney(order.total_amount),
        formatDate(order.created_at),
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = query.length === 0 || haystack.includes(query);

      return matchesStatus && matchesQuery;
    });

    return [...matched].sort((a, b) => {
      switch (orderSort) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "amount-high":
          return b.total_amount - a.total_amount;
        case "amount-low":
          return a.total_amount - b.total_amount;
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [orderQuery, orderSort, orderStatusFilter, recentOrders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / orderPageSize));

  useEffect(() => {
    setOrderPage(1);
  }, [orderQuery, orderSort, orderStatusFilter, orderPageSize]);

  useEffect(() => {
    setOrderPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const visibleOrders = useMemo(() => {
    const startIndex = (orderPage - 1) * orderPageSize;
    return filteredOrders.slice(startIndex, startIndex + orderPageSize);
  }, [filteredOrders, orderPage, orderPageSize]);

  const startOrderIndex = filteredOrders.length === 0 ? 0 : (orderPage - 1) * orderPageSize + 1;
  const endOrderIndex = Math.min(orderPage * orderPageSize, filteredOrders.length);

  const handleTabChange = (nextTab: string) => {
    const resolvedTab = resolveAccountTab(nextTab);
    const nextParams = new URLSearchParams(searchParams);

    if (resolvedTab === "profile") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", resolvedTab);
    }

    setSearchParams(nextParams, { replace: true });
  };

  const handleFieldChange = (field: keyof UserProfile, value: string | null) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleAddressFieldChange = (field: keyof AddressDraft, value: string | boolean) => {
    setAddressDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setProfileSaving(true);
    try {
      const savedProfile = await apiUpdateAccountProfile({
        last_name: draft.last_name,
        first_name: draft.first_name,
        middle_name: draft.middle_name,
        email: draft.email,
        phone: draft.phone,
        avatar_url: draft.avatar_url,
      });

      setProfile(savedProfile);
      setDraft(savedProfile);
      toast.success("Профиль сохранен");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить профиль");
    } finally {
      setProfileSaving(false);
    }
  };

  const syncDraftFromProfile = () => {
    setDraft(profile);
  };

  const persistProfilePatch = (patch: Partial<UserProfile>) => {
    setDraft((current) => ({
      ...current,
      ...patch,
      updated_at: new Date().toISOString(),
    }));
  };

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Выберите изображение");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Размер фото должен быть не больше 5 МБ");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;

      if (!dataUrl) {
        toast.error("Не удалось загрузить фото");
        return;
      }

      setCropSrc(dataUrl);
    };

    reader.onerror = () => {
      toast.error("Не удалось загрузить фото");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleCropConfirm = (croppedBase64: string) => {
    setCropSrc(null);
    persistProfilePatch({ avatar_url: croppedBase64 });
    toast.success("Фото добавлено. Сохраните профиль");
  };

  const handleCropCancel = () => {
    setCropSrc(null);
  };

  const handleAvatarDelete = () => {
    if (!draft.avatar_url) {
      return;
    }

    persistProfilePatch({ avatar_url: null });
    toast.success("Фото удалено. Сохраните профиль");
  };

  const openCreateAddressDialog = () => {
    setEditingAddress(null);
    setAddressDraft(createAddressDraft(profile, addresses.length === 0));
    setAddressDialogOpen(true);
  };

  const openEditAddressDialog = (address: StoreAddress) => {
    setEditingAddress(address);
    setAddressDraft(addressToDraft(address));
    setAddressDialogOpen(true);
  };

  const handleSaveAddress = async () => {
    const payload = toAddressPayload(addressDraft);

    if (!payload.customer_name || !payload.country || !payload.city || !payload.address_line1) {
      toast.error("Укажите получателя, страну, город и адрес");
      return;
    }

    setAddressSaving(true);
    try {
      const rows = editingAddress
        ? await apiUpdateAccountAddress(editingAddress.id, payload)
        : await apiCreateAccountAddress(payload);

      setAddresses(rows);
      setAddressDialogOpen(false);
      setEditingAddress(null);
      toast.success(editingAddress ? "Адрес обновлён" : "Адрес добавлен");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить адрес");
    } finally {
      setAddressSaving(false);
    }
  };

  const handleSetDefaultAddress = async (addressId: number) => {
    setAddressBusyId(addressId);
    try {
      const rows = await apiSetDefaultAccountAddress(addressId);
      setAddresses(rows);
      toast.success("Адрес по умолчанию обновлён");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось выбрать адрес");
    } finally {
      setAddressBusyId(null);
    }
  };

  const handleDeleteAddress = async (address: StoreAddress) => {
    if (!window.confirm("Удалить этот адрес из адресной книги?")) {
      return;
    }

    setAddressBusyId(address.id);
    try {
      const rows = await apiDeleteAccountAddress(address.id);
      setAddresses(rows);
      toast.success("Адрес удалён");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось удалить адрес");
    } finally {
      setAddressBusyId(null);
    }
  };

  const handleSecuritySave = () => {
    if (!securityDraft.currentPassword || !securityDraft.newPassword || !securityDraft.confirmPassword) {
      toast.error("Заполните все поля для смены пароля");
      return;
    }

    if (securityDraft.newPassword.length < 8) {
      toast.error("Новый пароль должен быть не короче 8 символов");
      return;
    }

    if (securityDraft.newPassword !== securityDraft.confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }

    setSecurityDraft((current) => ({
      ...current,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
    toast.success("Настройки безопасности обновлены");
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Header />
      <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_10%_20%,rgba(0,0,0,0.08),transparent_28%),radial-gradient(circle_at_90%_12%,rgba(0,0,0,0.06),transparent_26%),linear-gradient(to_bottom,rgba(248,247,244,1),rgba(255,255,255,0.92))]" />
      <div className="absolute left-0 top-24 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-foreground/5 blur-3xl" />
      <div className="absolute right-0 top-56 -z-10 h-80 w-80 translate-x-1/2 rounded-full bg-foreground/5 blur-3xl" />

      <section className="flex w-full flex-col gap-8 px-4 pb-10 pt-4 sm:px-5 md:px-6 md:pb-14 md:pt-6">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <Card className="border-border/70 bg-background/85 shadow-[0_20px_60px_rgba(0,0,0,0.06)] backdrop-blur">
            <CardContent className="space-y-4 pt-6">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">Личный профиль</p>
                <p className="text-2xl font-light">{fullName}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                <div className="min-w-0 rounded-2xl border border-border bg-card px-4 py-3 flex flex-col items-center justify-center text-center">
                  <p className="text-[11px] uppercase leading-none tracking-[0.08em] whitespace-nowrap text-muted-foreground">
                    Заказы
                  </p>
                  <p className="mt-1 text-xl font-medium">{loading ? "—" : recentOrders.length}</p>
                </div>
                <div className="min-w-0 rounded-2xl border border-border bg-card px-4 py-3 flex flex-col items-center justify-center text-center">
                  <p className="text-[11px] uppercase leading-none tracking-[0.08em] whitespace-nowrap text-muted-foreground">
                    Доставлено
                  </p>
                  <p className="mt-1 text-xl font-medium">{loading ? "—" : deliveredOrders}</p>
                </div>
                <div className="min-w-0 rounded-2xl border border-border bg-card px-4 py-3 flex flex-col items-center justify-center text-center">
                  <p className="text-[11px] uppercase leading-none tracking-[0.08em] whitespace-nowrap text-muted-foreground">
                    Избранное
                  </p>
                  <p className="mt-1 text-xl font-medium">{favoriteCount}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail size={16} />
                    Email
                  </div>
                  <p className="mt-2 text-sm font-medium break-all">{profile.email || "Не указан"}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone size={16} />
                    Телефон
                  </div>
                  <p className="mt-2 text-sm font-medium">{profile.phone || "Не указан"}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays size={16} />
                    Создан
                  </div>
                  <p className="mt-2 text-sm font-medium">{formatDate(profile.created_at)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 size={16} />
                    Обновлён
                  </div>
                  <p className="mt-2 text-sm font-medium">{formatDateTime(profile.updated_at)}</p>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-muted p-1">
                  <TabsTrigger value="profile" className="rounded-xl">
                    Профиль
                  </TabsTrigger>
                  <TabsTrigger value="addresses" className="rounded-xl">
                    Адреса
                  </TabsTrigger>
                  <TabsTrigger value="favorites" className="rounded-xl">
                    Избранное
                  </TabsTrigger>
                  <TabsTrigger value="security" className="rounded-xl">
                    Безопасность
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6">
                  <Card className="border-border/70">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-light">Редактирование профиля</CardTitle>
                      <CardDescription>Редактирование контактных данных и фото профиля</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-20 w-20 border border-border bg-background">
                            <AvatarImage src={draft.avatar_url ?? undefined} alt={draftFullName || "Профиль"} />
                            <AvatarFallback className="text-lg font-medium">{draftInitials}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Фото профиля</p>
                            <p className="max-w-md text-sm text-muted-foreground">
                              JPG, PNG или WebP. Можно загрузить новое фото или удалить текущее.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => avatarInputRef.current?.click()}
                          >
                            <ImageUp size={16} />
                            Загрузить фото
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full"
                            onClick={handleAvatarDelete}
                            disabled={!draft.avatar_url}
                          >
                            <Trash2 size={16} />
                            Удалить
                          </Button>
                        </div>
                      </div>

                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />

                      {cropSrc && (
                        <AvatarCropDialog
                          open={true}
                          imageSrc={cropSrc}
                          onConfirm={handleCropConfirm}
                          onCancel={handleCropCancel}
                        />
                      )}

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="last_name">Фамилия</Label>
                          <Input
                            id="last_name"
                            value={draft.last_name}
                            onChange={(event) => handleFieldChange("last_name", event.target.value)}
                            placeholder="Иванова"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="first_name">Имя</Label>
                          <Input
                            id="first_name"
                            value={draft.first_name}
                            onChange={(event) => handleFieldChange("first_name", event.target.value)}
                            placeholder="Марина"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="middle_name">Отчество</Label>
                          <Input
                            id="middle_name"
                            value={draft.middle_name ?? ""}
                            onChange={(event) => handleFieldChange("middle_name", event.target.value || null)}
                            placeholder="Сергеевна"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={draft.email}
                            onChange={(event) => handleFieldChange("email", event.target.value)}
                            placeholder="marina.ivanova@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Телефон</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={draft.phone ?? ""}
                            onChange={(event) => handleFieldChange("phone", event.target.value || null)}
                            placeholder="+7 (999) 123-45-67"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-3">
                          <Button variant="outline" onClick={syncDraftFromProfile} disabled={profileSaving}>
                            Отменить изменения
                          </Button>
                          <Button onClick={() => void handleSave()} disabled={profileSaving}>
                            {profileSaving ? "Сохранение..." : "Сохранить профиль"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="addresses" className="mt-6">
                  <Card className="border-border/70">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle className="text-lg font-light">Адресная книга</CardTitle>
                          <CardDescription>
                            Сохраняйте адреса доставки и выбирайте адрес по умолчанию для следующих заказов
                          </CardDescription>
                        </div>
                        <Button type="button" className="rounded-full" onClick={openCreateAddressDialog}>
                          <Plus size={16} />
                          Добавить адрес
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {defaultAddress ? (
                        <div className="rounded-3xl border border-border bg-card p-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                              <Home size={18} />
                            </div>
                            <div className="min-w-0 space-y-1">
                              <p className="text-sm font-medium">Адрес по умолчанию</p>
                              <p className="text-sm text-muted-foreground">{formatAddress(defaultAddress)}</p>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {loading ? (
                        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
                          Загрузка адресов...
                        </div>
                      ) : addresses.length > 0 ? (
                        <div className="grid gap-4 xl:grid-cols-2">
                          {addresses.map((address) => (
                            <Card key={address.id} className="border-border/70 bg-background">
                              <CardContent className="space-y-4 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-base font-medium">{address.label || "Адрес доставки"}</p>
                                      {address.is_default ? (
                                        <Badge variant="secondary" className="rounded-full">
                                          По умолчанию
                                        </Badge>
                                      ) : null}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{address.customer_name}</p>
                                  </div>
                                  <div className="flex shrink-0 gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="rounded-full"
                                      onClick={() => openEditAddressDialog(address)}
                                      disabled={addressBusyId === address.id}
                                    >
                                      <Pencil size={16} />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="rounded-full"
                                      onClick={() => void handleDeleteAddress(address)}
                                      disabled={addressBusyId === address.id}
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                </div>

                                <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
                                  <div className="flex items-start gap-2 text-sm">
                                    <MapPin size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                                    <span>{formatAddress(address)}</span>
                                  </div>
                                  <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                                    <span>{address.phone || "Телефон не указан"}</span>
                                    <span className="break-all">{address.email || "Email не указан"}</span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    variant={address.is_default ? "secondary" : "outline"}
                                    className="rounded-full"
                                    onClick={() => void handleSetDefaultAddress(address.id)}
                                    disabled={address.is_default || addressBusyId === address.id}
                                  >
                                    <Star size={16} className={address.is_default ? "fill-current" : ""} />
                                    {address.is_default ? "Выбран по умолчанию" : "Сделать основным"}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
                          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background">
                            <MapPin size={22} className="text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-light text-foreground">Адресов пока нет</h3>
                          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                            Добавьте первый адрес, чтобы быстрее оформлять следующие заказы.
                          </p>
                          <Button type="button" className="mt-6 rounded-full" onClick={openCreateAddressDialog}>
                            <Plus size={16} />
                            Добавить адрес
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="favorites" className="mt-6">
                  <Card className="border-border/70">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle className="text-lg font-light">Избранные товары</CardTitle>
                          <CardDescription>Товары, которые вы отметили сердечком, сохраняются в профиле</CardDescription>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground w-fit">
                          <Heart size={13} className={favoriteCount > 0 ? "fill-current text-rose-500" : ""} />
                          {favoriteCount} товаров
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {favoriteProducts.length > 0 ? (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                            <p className="text-sm text-muted-foreground">
                              Здесь отображаются сохраненные товары. Сердечко в каталоге убирает товар из списка.
                            </p>
                            <Button variant="outline" className="rounded-full" onClick={clearFavorites}>
                              Очистить все
                            </Button>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {favoriteProducts.map((product) => (
                              <Card key={product.id} className="group relative overflow-hidden border-border/70 bg-background shadow-[0_12px_30px_rgba(0,0,0,0.04)]">
                                <FavoriteToggleButton
                                  productId={product.id}
                                  className="absolute right-3 top-3 z-20 h-10 w-10"
                                />
                                <Link to={`/product/${product.id}`} className="block h-full">
                                  <CardContent className="p-0">
                                    <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                                      <img
                                        src={product.image}
                                        alt={product.name}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                                      />
                                    </div>
                                    <div className="space-y-2 p-4">
                                      <p className="text-xs font-light text-muted-foreground uppercase tracking-[0.14em]">
                                        {typeLabels[product.type]} · {genderLabels[normalizeGenderValue(product.gender) || "men"]}
                                      </p>
                                      <h3 className="min-h-[3.5rem] text-sm md:text-base font-medium text-foreground leading-snug">
                                        {product.name}
                                      </h3>
                                      <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-light text-foreground">{formatPrice(product.price)}</p>
                                        <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                          Открыть →
                                        </span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Link>
                              </Card>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
                          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background">
                            <Heart size={22} className="text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-light text-foreground">Пока пусто</h3>
                          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                            Добавляйте товары в избранное через сердечко в каталоге, и они появятся здесь.
                          </p>
                          <div className="mt-6 flex justify-center gap-3">
                            <Button asChild>
                              <Link to="/category/all">Перейти в каталог</Link>
                            </Button>
                            <Button asChild variant="outline">
                              <Link to="/category/men">Смотреть мужское</Link>
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="security" className="mt-6">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="border-border/70">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-light">Смена пароля</CardTitle>
                        <CardDescription>Локальная заготовка интерфейса. Серверная смена пароля ещё не подключена</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Текущий пароль</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={securityDraft.currentPassword}
                            onChange={(event) =>
                              setSecurityDraft((current) => ({ ...current, currentPassword: event.target.value }))
                            }
                            placeholder="Введите текущий пароль"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">Новый пароль</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={securityDraft.newPassword}
                            onChange={(event) =>
                              setSecurityDraft((current) => ({ ...current, newPassword: event.target.value }))
                            }
                            placeholder="Минимум 8 символов"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Подтверждение пароля</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={securityDraft.confirmPassword}
                            onChange={(event) =>
                              setSecurityDraft((current) => ({ ...current, confirmPassword: event.target.value }))
                            }
                            placeholder="Повторите новый пароль"
                          />
                        </div>
                        <Button className="w-full rounded-full" onClick={handleSecuritySave}>
                          Сохранить пароль
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-border/70">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-light">Уведомления безопасности</CardTitle>
                        <CardDescription>Выберите, какие уведомления хотите получать</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <label className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                          <Checkbox
                            checked={securityDraft.loginAlerts}
                            onCheckedChange={(checked) =>
                              setSecurityDraft((current) => ({
                                ...current,
                                loginAlerts: checked === true,
                              }))
                            }
                          />
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Уведомления о входе</p>
                            <p className="text-sm text-muted-foreground">
                              Получайте письмо при входе в аккаунт с нового устройства.
                            </p>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                          <Checkbox
                            checked={securityDraft.passwordReminders}
                            onCheckedChange={(checked) =>
                              setSecurityDraft((current) => ({
                                ...current,
                                passwordReminders: checked === true,
                              }))
                            }
                          />
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Напоминания о пароле</p>
                            <p className="text-sm text-muted-foreground">
                              Раз в 90 дней показывать подсказку о смене пароля.
                            </p>
                          </div>
                        </label>

                        <div className="rounded-2xl border border-dashed border-border p-4">
                          <p className="text-sm font-medium">Совет</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Используйте длинный уникальный пароль и не повторяйте его в других сервисах.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>

              <Dialog
                open={addressDialogOpen}
                onOpenChange={(open) => {
                  if (!addressSaving) {
                    setAddressDialogOpen(open);
                  }
                }}
              >
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingAddress ? "Редактирование адреса" : "Новый адрес"}</DialogTitle>
                    <DialogDescription>
                      Поля получателя, страны, города и адреса обязательны для доставки.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="address_label">Метка</Label>
                      <Input
                        id="address_label"
                        value={addressDraft.label}
                        onChange={(event) => handleAddressFieldChange("label", event.target.value)}
                        placeholder="Дом, офис, пункт выдачи"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_customer_name">Получатель</Label>
                      <Input
                        id="address_customer_name"
                        value={addressDraft.customer_name}
                        onChange={(event) => handleAddressFieldChange("customer_name", event.target.value)}
                        placeholder="Иванова Марина"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_email">Email</Label>
                      <Input
                        id="address_email"
                        type="email"
                        value={addressDraft.email}
                        onChange={(event) => handleAddressFieldChange("email", event.target.value)}
                        placeholder="marina.ivanova@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_phone">Телефон</Label>
                      <Input
                        id="address_phone"
                        type="tel"
                        value={addressDraft.phone}
                        onChange={(event) => handleAddressFieldChange("phone", event.target.value)}
                        placeholder="+7 (999) 123-45-67"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_country">Страна</Label>
                      <Input
                        id="address_country"
                        value={addressDraft.country}
                        onChange={(event) => handleAddressFieldChange("country", event.target.value)}
                        placeholder="Россия"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_city">Город</Label>
                      <Input
                        id="address_city"
                        value={addressDraft.city}
                        onChange={(event) => handleAddressFieldChange("city", event.target.value)}
                        placeholder="Москва"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_line1">Адрес</Label>
                      <Input
                        id="address_line1"
                        value={addressDraft.address_line1}
                        onChange={(event) => handleAddressFieldChange("address_line1", event.target.value)}
                        placeholder="ул. Ленина, 10, кв. 5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_line2">Дополнение</Label>
                      <Input
                        id="address_line2"
                        value={addressDraft.address_line2}
                        onChange={(event) => handleAddressFieldChange("address_line2", event.target.value)}
                        placeholder="Подъезд, этаж, домофон"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_postal_code">Индекс</Label>
                      <Input
                        id="address_postal_code"
                        value={addressDraft.postal_code}
                        onChange={(event) => handleAddressFieldChange("postal_code", event.target.value)}
                        placeholder="101000"
                      />
                    </div>
                    <label className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 md:mt-7">
                      <Checkbox
                        checked={addressDraft.is_default}
                        onCheckedChange={(checked) => handleAddressFieldChange("is_default", checked === true)}
                      />
                      <span className="text-sm font-medium">Использовать по умолчанию</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAddressDialogOpen(false)}
                      disabled={addressSaving}
                    >
                      Отмена
                    </Button>
                    <Button type="button" onClick={() => void handleSaveAddress()} disabled={addressSaving}>
                      {addressSaving ? "Сохранение..." : "Сохранить адрес"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/70 bg-background/85 shadow-[0_16px_50px_rgba(0,0,0,0.05)] backdrop-blur">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <CardTitle className="text-lg font-light">Ваши заказы</CardTitle>
                  </div>

                  <div className="grid gap-3 xl:grid-cols-[1.4fr_0.8fr_0.8fr]">
                    <div className="relative">
                      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={orderQuery}
                        onChange={(event) => setOrderQuery(event.target.value)}
                        placeholder="Поиск по заказу, адресу, оплате или сумме"
                        className="h-11 pl-9"
                      />
                    </div>

                    <Select value={orderStatusFilter} onValueChange={(value) => setOrderStatusFilter(value as OrderStatusFilter)}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все статусы</SelectItem>
                        <SelectItem value="new">Новые</SelectItem>
                        <SelectItem value="confirmed">Подтверждённые</SelectItem>
                        <SelectItem value="packing">На сборке</SelectItem>
                        <SelectItem value="shipped">В пути</SelectItem>
                        <SelectItem value="completed">Доставленные</SelectItem>
                        <SelectItem value="cancelled">Отменённые</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={orderSort} onValueChange={(value) => setOrderSort(value as OrderSort)}>
                      <SelectTrigger className="h-11">
                        <div className="flex items-center gap-2">
                          <ArrowUpDown size={14} className="text-muted-foreground" />
                          <SelectValue placeholder="Сортировка" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Сначала новые</SelectItem>
                        <SelectItem value="oldest">Сначала старые</SelectItem>
                        <SelectItem value="amount-high">Сумма: по убыванию</SelectItem>
                        <SelectItem value="amount-low">Сумма: по возрастанию</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1">
                        <Package2 size={12} />
                        {loading ? "Загрузка..." : `${filteredOrders.length} записей`}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1">
                        <CalendarDays size={12} />
                        {startOrderIndex}-{endOrderIndex} из {filteredOrders.length || 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select value={String(orderPageSize)} onValueChange={(value) => setOrderPageSize(Number(value))}>
                        <SelectTrigger className="h-9 w-[110px]">
                          <SelectValue placeholder="Строк" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="8">8 / стр.</SelectItem>
                          <SelectItem value="12">12 / стр.</SelectItem>
                          <SelectItem value="20">20 / стр.</SelectItem>
                          <SelectItem value="40">40 / стр.</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="overflow-hidden rounded-3xl border border-border bg-background">
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-28">Заказ</TableHead>
                          <TableHead className="w-36">Дата</TableHead>
                          <TableHead className="w-32">Статус</TableHead>
                          <TableHead className="w-36 text-right">Сумма</TableHead>
                          <TableHead className="w-36">Доставка</TableHead>
                          <TableHead className="w-28">Оплата</TableHead>
                          <TableHead>Адрес</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                              Загрузка заказов...
                            </TableCell>
                          </TableRow>
                        ) : visibleOrders.length > 0 ? (
                          visibleOrders.map((order) => {
                            const meta = statusMeta[order.status] ?? statusMeta.new;

                            return (
                              <TableRow key={order.id} className="group">
                                <TableCell className="font-medium">#{order.id}</TableCell>
                                <TableCell className="text-muted-foreground">{formatShortDate(order.created_at)}</TableCell>
                                <TableCell>
                                  <Badge variant={meta.variant} className="rounded-full px-2.5 py-0.5 text-xs">
                                    {meta.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">{formatMoney(order.total_amount)}</TableCell>
                                <TableCell className="text-muted-foreground">{order.delivery_method}</TableCell>
                                <TableCell className="text-muted-foreground">{order.payment_method}</TableCell>
                                <TableCell className="max-w-[18rem] truncate text-muted-foreground">
                                  {order.delivery_address}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="py-12 text-center">
                              <div className="mx-auto max-w-sm space-y-2">
                                <p className="text-sm font-medium text-foreground">Ничего не найдено</p>
                                <p className="text-sm text-muted-foreground">
                                  Попробуйте изменить запрос, статус или сортировку.
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-border pt-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Страница {orderPage} из {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      disabled={orderPage <= 1}
                      onClick={() => setOrderPage((current) => Math.max(1, current - 1))}
                    >
                      <ChevronLeft size={16} />
                      Назад
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      disabled={orderPage >= totalPages}
                      onClick={() => setOrderPage((current) => Math.min(totalPages, current + 1))}
                    >
                      Вперед
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {(
                    [
                      ["new", "Новые"],
                      ["confirmed", "Подтверждённые"],
                      ["packing", "На сборке"],
                      ["shipped", "В пути"],
                      ["completed", "Доставленные"],
                      ["cancelled", "Отменённые"],
                    ] as const
                  ).map(([status, label]) => (
                    <div key={status} className="rounded-2xl border border-border bg-card px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground break-words leading-tight">{label}</p>
                      <p className="mt-1 text-xl font-light text-foreground">{orderStatusCounts[status]}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>
    </main>
  );
};

export default Account;
