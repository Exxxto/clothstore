import { useEffect } from "react";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = "Политика конфиденциальности - Силуэт";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-6">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-light text-foreground mb-4">Политика конфиденциальности</h1>
            <p className="text-muted-foreground">Последнее обновление: 15 января 2024</p>
          </header>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Введение</h2>
              <p className="text-muted-foreground leading-relaxed">
                В «Силуэт» мы уважаем вашу конфиденциальность и стремимся защитить ваши персональные данные.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Собираемая информация</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-light text-foreground mb-2">Личная информация</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Мы можем собирать личную информацию, которую вы предоставляете нам напрямую, включая:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                    <li>Имя, адрес электронной почты и контактные данные</li>
                    <li>Платёжные и адреса доставки</li>
                    <li>Платёжные данные (обрабатываются безопасно через сторонних провайдеров)</li>
                    <li>Настройки аккаунта и коммуникаций</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-light text-foreground mb-2">Данные об использовании</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Мы автоматически собираем некоторые сведения об устройстве и сценариях использования, включая IP-адрес, тип браузера, посещённые страницы и данные взаимодействия, чтобы улучшать сервис и пользовательский опыт.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Как мы используем ваши данные</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Мы используем собираемую информацию для следующих целей:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Обработка и выполнение заказов</li>
                <li>Предоставление поддержки и ответы на обращения</li>
                <li>Отправка рекламных сообщений (с вашего согласия)</li>
                <li>Улучшение работы сайта и пользовательского опыта</li>
                <li>Предотвращение мошенничества и обеспечение безопасности</li>
                <li>Соблюдение требований законодательства</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Передача и раскрытие информации</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Мы не продаём, не обмениваем и не сдаём в аренду ваши персональные данные третьим лицам. Передача возможна только в следующих случаях:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Поставщикам услуг, которые помогают нам вести бизнес</li>
                <li>Когда этого требует закон или защита наших прав</li>
                <li>В связи с корпоративной сделкой (слияние, поглощение и т. п.)</li>
                <li>При наличии вашего явного согласия</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Безопасность данных</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы применяем необходимые технические и организационные меры для защиты ваших персональных данных от несанкционированного доступа, изменения, раскрытия или уничтожения. Однако ни один способ передачи данных через интернет и ни один способ электронного хранения не является абсолютно безопасным.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Ваши права и выбор</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                В зависимости от вашего местоположения вы можете обладать следующими правами в отношении персональных данных:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Доступ к вашим персональным данным</li>
                <li>Исправление неточной или неполной информации</li>
                <li>Удаление ваших персональных данных</li>
                <li>Возражение против обработки или её ограничение</li>
                <li>Перенос данных</li>
                <li>Отзыв согласия (где применимо)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Файлы cookie и отслеживание</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы используем файлы cookie и похожие технологии отслеживания, чтобы улучшать навигацию, анализировать трафик и персонализировать контент. Вы можете управлять cookie в настройках браузера, но это может повлиять на работу сайта.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Изменения в политике</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы можем время от времени обновлять эту Политику конфиденциальности. О существенных изменениях мы сообщим, разместив новую версию на сайте и обновив дату «Последнее обновление» выше.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Связаться с нами</h2>
              <p className="text-muted-foreground leading-relaxed">
                Если у вас есть вопросы по этой Политике конфиденциальности или нашим практикам обработки данных, свяжитесь с нами:
              </p>
              <div className="mt-4 text-muted-foreground">
                <p>Email: privacy@siluet.ru</p>
                <p>Phone: +1 (212) 555-0123</p>
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

export default PrivacyPolicy;
