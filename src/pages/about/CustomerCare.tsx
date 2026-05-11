import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import AboutSidebar from "../../components/about/AboutSidebar";

const CustomerCare = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>
        
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
        <PageHeader 
          title="Служба поддержки" 
          subtitle="Мы поможем вам со всеми вопросами по украшениям"
        />
        
        <ContentSection title="Контактная информация">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-light text-foreground">Телефон</h3>
              <p className="text-muted-foreground">+7 (863) 555-01-23</p>
              <p className="text-sm text-muted-foreground">Пн-Пт: 9:00-18:00 МСК<br />Сб: 10:00-16:00 МСК</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-light text-foreground">Электронная почта</h3>
              <p className="text-muted-foreground">care@siluet.ru</p>
              <p className="text-sm text-muted-foreground">Ответ в течение 24 часов</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-light text-foreground">Онлайн-чат</h3>
              <Button variant="outline" className="rounded-none">
                Начать чат
              </Button>
              <p className="text-sm text-muted-foreground">Доступен в рабочие часы</p>
            </div>
          </div>
        </ContentSection>

        <ContentSection title="Часто задаваемые вопросы">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="shipping" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                Какие есть варианты и сроки доставки?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Мы предлагаем бесплатную стандартную доставку (3-5 рабочих дней) для заказов от $500. Экспресс-доставка (1-2 рабочих дня) доступна за $25. Все заказы полностью застрахованы и требуют подтверждения подписью.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="returns" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                Каковы условия возврата и обмена?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Мы принимаем возврат в течение 30 дней для неношеных товаров в исходном состоянии. Изделия на заказ и с гравировкой возврату не подлежат. Возврат бесплатный благодаря предоплаченному ярлыку.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="warranty" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                Какая гарантия действует на украшения?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                На все украшения «Силуэт» распространяется пожизненная гарантия от производственных дефектов.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sizing" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                Можно ли изменить размер украшения после покупки?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Да, мы бесплатно меняем размер кольца в течение 60 дней после покупки (до 2 размеров). Дополнительная корректировка доступна за сервисный сбор. Некоторые модели нельзя изменить по конструкции.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="care" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                Как ухаживать за украшениями «Силуэт»?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Храните изделия отдельно в мягких мешочках, избегайте контакта с химией и косметикой, очищайте мягкой тканью. Мы рекомендуем профессиональную чистку каждые 6-12 месяцев.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="authentication" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                Как проверить подлинность украшения?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Каждое изделие «Силуэт» поставляется с сертификатом подлинности и клеймом.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ContentSection>

        <ContentSection title="Форма обращения">
          <div>
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-light text-foreground">Имя</label>
                  <Input className="rounded-none" placeholder="Введите имя" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-light text-foreground">Фамилия</label>
                  <Input className="rounded-none" placeholder="Введите фамилию" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-light text-foreground">Электронная почта</label>
                <Input type="email" className="rounded-none" placeholder="Введите email" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-light text-foreground">Номер заказа (необязательно)</label>
                <Input className="rounded-none" placeholder="Введите номер заказа, если есть" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-light text-foreground">Чем мы можем помочь?</label>
                <Textarea 
                  className="rounded-none min-h-[120px]" 
                  placeholder="Опишите ваш вопрос подробно"
                />
              </div>
              
              <Button type="submit" className="w-full rounded-none">
                Отправить сообщение
              </Button>
            </form>
          </div>
        </ContentSection>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default CustomerCare;
