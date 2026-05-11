import { useEffect } from "react";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";

const TermsOfService = () => {
  useEffect(() => {
    document.title = "Условия использования - Силуэт";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-6">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-light text-foreground mb-4">Условия использования</h1>
            <p className="text-muted-foreground">Последнее обновление: 15 января 2024</p>
          </header>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Согласие с условиями</h2>
              <p className="text-muted-foreground leading-relaxed">
                Получая доступ к сайту и сервисам «Силуэт» и используя их, вы принимаете и соглашаетесь соблюдать условия настоящего соглашения.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Лицензия на использование</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Разрешается временно загрузить одну копию материалов с сайта «Силуэт» только для личного, некоммерческого и временного просмотра.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Изменять или копировать материалы</li>
                <li>Использовать материалы в коммерческих целях или для публичного показа</li>
                <li>Пытаться выполнять обратную разработку любого ПО, размещённого на сайте</li>
                <li>Удалять любые уведомления об авторских или иных правах</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Информация о товарах и доступность</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы стремимся предоставлять точную информацию о товарах, включая описания, цены и наличие. Однако мы не гарантируем, что описания или другой контент являются точными, полными, надёжными или безошибочными. Мы оставляем за собой право изменять или снимать товары с продажи без предварительного уведомления.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Заказы и оплата</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-light text-foreground mb-2">Принятие заказа</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Все заказы зависят от подтверждения и наличия товара. Мы оставляем за собой право отказать в заказе или отменить его по любой причине, включая, но не ограничиваясь, отсутствием товара, ошибками в информации о товаре или подозрением на мошенничество.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-light text-foreground mb-2">Условия оплаты</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Оплата производится в момент покупки. Мы принимаем основные банковские карты и другие способы оплаты, указанные при оформлении заказа. Все цены указаны в долларах США, если не указано иное.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Доставка</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Мы приложим все усилия, чтобы отправить заказы в указанные сроки. Однако сроки доставки являются ориентировочными, и мы не несем ответственности за задержки, вызванные перевозчиками или обстоятельствами вне нашего контроля.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Риск утраты и право собственности на товары переходят к вам в момент передачи перевозчику. Мы не отвечаем за утерянные, украденные или повреждённые посылки после доставки по указанному адресу.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Возврат и обмен</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Мы хотим, чтобы вы были полностью довольны покупкой. Возврат и обмен принимаются в течение 30 дней с момента доставки при соблюдении следующих условий:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Товар должен быть в исходном состоянии и оригинальной упаковке</li>
                <li>Индивидуальные или персонализированные товары возврату не подлежат</li>
                <li>Стоимость обратной доставки оплачивает клиент</li>
                <li>Возврат средств производится на исходный способ оплаты</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Гарантия и уход</h2>
              <p className="text-muted-foreground leading-relaxed">
                На наши украшения действует ограниченная гарантия от производственных дефектов. Гарантия не распространяется на повреждения от естественного износа, неправильного ухода или несчастных случаев. Рекомендации по уходу прилагаются к каждой покупке и размещены на сайте.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Интеллектуальная собственность</h2>
              <p className="text-muted-foreground leading-relaxed">
                Весь контент на этом сайте, включая, помимо прочего, текст, графику, логотипы, изображения и программное обеспечение, является собственностью «Силуэт» и защищён законами об авторском праве, товарных знаках и иной интеллектуальной собственности.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Ограничение ответственности</h2>
              <p className="text-muted-foreground leading-relaxed">
                «Силуэт» и его поставщики не несут ответственности за любые убытки, возникшие в результате использования или невозможности использования материалов на нашем сайте или товаров.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Политика конфиденциальности</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ваша конфиденциальность важна для нас. Пожалуйста, ознакомьтесь с нашей Политикой конфиденциальности, которая также регулирует использование сайта и сервисов, чтобы понять, как мы работаем с вашими персональными данными.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Применимое право</h2>
              <p className="text-muted-foreground leading-relaxed">
                Настоящие условия регулируются и толкуются в соответствии с законами штата Нью-Йорк, а вы безотзывно соглашаетесь на исключительную юрисдикцию судов этого штата или территории.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Изменения условий</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы оставляем за собой право изменять эти Условия использования в любое время без уведомления. Используя этот сайт, вы соглашаетесь с действующей редакцией этих Условий использования.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Контактная информация</h2>
              <p className="text-muted-foreground leading-relaxed">
                Если у вас есть вопросы по этим Условиям использования, свяжитесь с нами:
              </p>
              <div className="mt-4 text-muted-foreground">
                <p>Email: legal@siluet.ru</p>
                <p>Телефон: +7 (863) 555-01-23</p>
                <p>Address: 123 Madison Avenue, New York, NY 10016</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsOfService;
