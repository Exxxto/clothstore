import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import AboutSidebar from "../../components/about/AboutSidebar";

const Returns = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>

        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
          <PageHeader
            title="Возврат и обмен"
            subtitle="Простой и прозрачный процесс возврата для вашего спокойствия"
          />

          <ContentSection title="Условия возврата">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-xl font-light text-foreground">Что можно вернуть</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="text-foreground">—</span>
                    Неношеные изделия в исходном состоянии
                  </li>
                  <li className="flex gap-3">
                    <span className="text-foreground">—</span>
                    Товары с оригинальными бирками и упаковкой
                  </li>
                  <li className="flex gap-3">
                    <span className="text-foreground">—</span>
                    Заказы, оформленные не более 30 дней назад
                  </li>
                </ul>
              </div>
              <div className="space-y-6">
                <h3 className="text-xl font-light text-foreground">Что не подлежит возврату</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="text-foreground">—</span>
                    Изделия на заказ и с персонализацией
                  </li>
                  <li className="flex gap-3">
                    <span className="text-foreground">—</span>
                    Товары со следами использования или повреждениями
                  </li>
                  <li className="flex gap-3">
                    <span className="text-foreground">—</span>
                    Товары без оригинальной упаковки
                  </li>
                </ul>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Как оформить возврат">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="text-3xl font-light text-foreground">01</div>
                <h3 className="text-lg font-light text-foreground">Свяжитесь с нами</h3>
                <p className="text-muted-foreground">
                  Напишите на care@siluet.ru или позвоните нам, указав номер заказа и причину возврата.
                </p>
              </div>
              <div className="space-y-4">
                <div className="text-3xl font-light text-foreground">02</div>
                <h3 className="text-lg font-light text-foreground">Получите ярлык</h3>
                <p className="text-muted-foreground">
                  Мы вышлем предоплаченный ярлык для возврата на вашу электронную почту в течение 24 часов.
                </p>
              </div>
              <div className="space-y-4">
                <div className="text-3xl font-light text-foreground">03</div>
                <h3 className="text-lg font-light text-foreground">Получите возврат</h3>
                <p className="text-muted-foreground">
                  После получения и проверки товара средства будут возвращены в течение 5-7 рабочих дней.
                </p>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Часто задаваемые вопросы">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="timeframe" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  В течение какого срока можно вернуть товар?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Возврат принимается в течение 30 дней с момента получения заказа. Товар должен быть в исходном состоянии с оригинальными бирками и упаковкой.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cost" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Возврат платный?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Нет, возврат бесплатный. Мы предоставляем предоплаченный ярлык для отправки.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="exchange" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Можно ли обменять товар на другой размер или цвет?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Да, обмен доступен при наличии нужного размера или цвета на складе. Свяжитесь с нашей службой поддержки, и мы поможем оформить обмен.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="refund-method" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Каким способом возвращаются деньги?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Средства возвращаются тем же способом, которым была произведена оплата. Срок зачисления зависит от вашего банка и обычно составляет 5-7 рабочих дней.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="damaged" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Что делать, если товар пришёл повреждённым?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Немедленно свяжитесь с нами и приложите фотографии повреждения. Мы организуем бесплатный возврат и отправим замену или вернём деньги в приоритетном порядке.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ContentSection>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Returns;
