import { FormEvent, useEffect, useMemo, useState } from "react";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TriangleAlert, ShieldCheck, MessageSquareQuote, ArrowRight } from "lucide-react";

const COMPLAINT_CATEGORIES = [
  { value: "quality", label: "Качество товара" },
  { value: "delivery", label: "Доставка" },
  { value: "service", label: "Сервис" },
  { value: "payment", label: "Оплата" },
  { value: "website", label: "Работа сайта" },
  { value: "other", label: "Другое" },
];

type FormState = {
  requester_name: string;
  email: string;
  phone: string;
  order_number: string;
  category: string;
  message: string;
};

const initialState: FormState = {
  requester_name: "",
  email: "",
  phone: "",
  order_number: "",
  category: "quality",
  message: "",
};

export default function Complaints() {
  const [form, setForm] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Жалобы - Силуэт";
  }, []);

  const selectedCategoryLabel = useMemo(
    () => COMPLAINT_CATEGORIES.find((item) => item.value === form.category)?.label || "Не выбрано",
    [form.category]
  );

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.requester_name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Заполните имя, email и текст жалобы");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requester_name: form.requester_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          order_number: form.order_number.trim() || null,
          category: form.category,
          message: form.message.trim(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Не удалось отправить жалобу" }));
        throw new Error(payload.error || "Не удалось отправить жалобу");
      }

      toast.success("Жалоба отправлена");
      setForm(initialState);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось отправить жалобу");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="overflow-hidden">
        <section className="relative px-6 pt-12 pb-8">
          <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.07),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,244,240,0.7))]" />
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
            <div className="pt-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <TriangleAlert className="w-3.5 h-3.5 text-foreground" />
                Обратная связь
              </div>
              <h1 className="mt-6 text-4xl md:text-6xl font-light tracking-[-0.04em] text-foreground max-w-2xl">
                Сообщите о проблеме без лишних шагов
              </h1>
              <p className="mt-5 text-lg text-muted-foreground max-w-2xl leading-relaxed">
                Оформите жалобу по заказу, доставке, оплате или качеству товара. Обращение сразу попадает в админ-панель и получает статус обработки.
              </p>

              <div className="mt-8 grid sm:grid-cols-3 gap-4 max-w-3xl">
                <div className="rounded-3xl border border-border bg-background/85 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.05)]">
                  <ShieldCheck className="w-5 h-5 text-foreground" />
                  <p className="mt-3 text-sm font-medium text-foreground">Прямая маршрутизация</p>
                  <p className="mt-1 text-sm text-muted-foreground">Жалоба сразу сохраняется в БД и видна админам.</p>
                </div>
                <div className="rounded-3xl border border-border bg-background/85 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.05)]">
                  <MessageSquareQuote className="w-5 h-5 text-foreground" />
                  <p className="mt-3 text-sm font-medium text-foreground">Полный контекст</p>
                  <p className="mt-1 text-sm text-muted-foreground">Сохраняются контактные данные, заказ и текст обращения.</p>
                </div>
                <div className="rounded-3xl border border-border bg-background/85 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.05)]">
                  <ArrowRight className="w-5 h-5 text-foreground" />
                  <p className="mt-3 text-sm font-medium text-foreground">Прозрачный статус</p>
                  <p className="mt-1 text-sm text-muted-foreground">Новая, в работе, решена или отклонена.</p>
                </div>
              </div>
            </div>

            <div className="lg:pt-8">
              <div className="rounded-[2rem] border border-border bg-background/95 p-6 md:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Форма жалобы</p>
                  <h2 className="mt-2 text-2xl font-light text-foreground">Опишите ситуацию</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Чем точнее описание, тем быстрее мы сможем проверить обращение.
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="requester_name">Имя *</Label>
                      <Input
                        id="requester_name"
                        value={form.requester_name}
                        onChange={handleChange("requester_name")}
                        placeholder="Как к вам обращаться"
                        className="rounded-2xl bg-background/70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange("email")}
                        placeholder="name@example.com"
                        className="rounded-2xl bg-background/70"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Телефон</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange("phone")}
                        placeholder="+7 (999) 000-00-00"
                        className="rounded-2xl bg-background/70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="order_number">Номер заказа</Label>
                      <Input
                        id="order_number"
                        value={form.order_number}
                        onChange={handleChange("order_number")}
                        placeholder="Если обращение связано с заказом"
                        className="rounded-2xl bg-background/70"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Категория *</Label>
                    <Select
                      value={form.category}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger id="category" className="rounded-2xl bg-background/70">
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPLAINT_CATEGORIES.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Текущая категория: {selectedCategoryLabel}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Текст жалобы *</Label>
                    <Textarea
                      id="message"
                      value={form.message}
                      onChange={handleChange("message")}
                      placeholder="Опишите проблему, что произошло и какой результат вы ожидаете"
                      className="min-h-[160px] rounded-2xl bg-background/70"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl h-12 text-sm font-medium"
                  >
                    {isSubmitting ? "Отправка..." : "Отправить жалобу"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-border bg-background p-6">
              <h3 className="text-lg font-light text-foreground">Что указать</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Имя, email, номер заказа при наличии и подробное описание проблемы. Это ускоряет проверку.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-background p-6">
              <h3 className="text-lg font-light text-foreground">Что происходит дальше</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Жалоба появляется в админ-панели в разделе "Жалобы", где ей назначается статус и дальнейшая обработка.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-background p-6">
              <h3 className="text-lg font-light text-foreground">Если нужна помощь</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Для общего обращения используйте раздел поддержки в футере. Для официальной жалобы оставляйте эту форму.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
