import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import AboutSidebar from "../../components/about/AboutSidebar";

const deliveryOptions = [
  {
    name: "Стандартная доставка",
    time: "3–5 рабочих дней",
    price: "Бесплатно от 5 000 ₽",
    description: "Доставка Почтой России или СДЭК до двери или пункта выдачи.",
  },
  {
    name: "Экспресс-доставка",
    time: "1–2 рабочих дня",
    price: "490 ₽",
    description: "Курьерская доставка по Москве и Санкт-Петербургу. Для других городов — через СДЭК Экспресс.",
  },
  {
    name: "Самовывоз",
    time: "Готово в течение дня",
    price: "Бесплатно",
    description: "Заберите заказ в любом из наших магазинов. Адреса доступны на странице «Наши магазины».",
  },
];

const Delivery = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>

        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
          <PageHeader
            title="Доставка"
            subtitle="Быстро, надёжно и с заботой о каждом заказе"
          />

          <ContentSection title="Варианты доставки">
            <div className="grid md:grid-cols-3 gap-6">
              {deliveryOptions.map((option) => (
                <div
                  key={option.name}
                  className="border border-border p-6 space-y-3"
                >
                  <h3 className="text-lg font-light text-foreground">{option.name}</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">Срок: </span>
                      {option.time}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">Стоимость: </span>
                      {option.price}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {option.description}
                  </p>
                </div>
              ))}
            </div>
          </ContentSection>

          <ContentSection title="Как отследить заказ">
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                После оформления заказа вы получите письмо с подтверждением и трек-номером для отслеживания.
                Статус доставки можно проверить в личном кабинете в разделе «Мои заказы» или на сайте
                службы доставки по трек-номеру.
              </p>
              <p>
                Если письмо не пришло в течение 24 часов — проверьте папку «Спам» или свяжитесь с нашей
                службой поддержки.
              </p>
            </div>
          </ContentSection>

          <ContentSection title="Условия и ограничения">
            <div className="space-y-3">
              {[
                "Доставка осуществляется по всей России.",
                "Заказы, оформленные до 14:00 по московскому времени, передаются в службу доставки в тот же день.",
                "Все заказы застрахованы на полную стоимость товара.",
                "При получении курьерской доставки потребуется подпись.",
                "Доставка в труднодоступные районы может занять дополнительное время.",
              ].map((item, i) => (
                <div key={i} className="flex gap-3 py-3 border-b border-border last:border-0">
                  <span className="text-muted-foreground text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </ContentSection>

          <ContentSection title="Возникли вопросы?">
            <p className="text-muted-foreground">
              Если у вас есть вопросы по доставке, обратитесь в нашу{" "}
              <a
                href="/about/customer-care"
                className="text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity"
              >
                службу поддержки
              </a>
              . Мы ответим в течение 24 часов.
            </p>
          </ContentSection>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Delivery;
