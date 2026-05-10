import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import StoreMap from "../../components/about/StoreMap";
import { Button } from "../../components/ui/button";
import AboutSidebar from "../../components/about/AboutSidebar";

const StoreLocator = () => {
  const stores = [
    {
      name: "Силуэт на Тверской",
      address: "789 Madison Avenue, New York, NY 10065",
      phone: "+1 (212) 555-0123",
      hours: "Пн-Сб: 10:00-20:00, Вс: 12:00-18:00",
      services: ["Персональный шопинг", "Индивидуальный дизайн", "Ремонт", "Оценка"]
    },
    {
      name: "Силуэт Арбат",
      address: "456 Rodeo Drive, Beverly Hills, CA 90210",
      phone: "+1 (310) 555-0456",
      hours: "Пн-Сб: 10:00-20:00, Вс: 12:00-18:00",
      services: ["Персональный шопинг", "Индивидуальный дизайн", "VIP-залы", "Ремонт"]
    },
    {
      name: "Силуэт Невский",
      address: "123 Spring Street, New York, NY 10012",
      phone: "+1 (212) 555-0789",
      hours: "Пн-Сб: 11:00-20:00, Вс: 12:00-19:00",
      services: ["Выбор и покупка", "Ремонт", "Подарочная упаковка"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>
        
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
        <PageHeader 
          title="Наши магазины" 
          subtitle="Посетите нас лично для индивидуального опыта"
        />
        
        <ContentSection title="Интерактивная карта магазинов">
          <StoreMap />
        </ContentSection>

        <ContentSection title="Наши адреса">
          <div className="grid gap-8">
            {stores.map((store, index) => (
              <div key={index} className="bg-background rounded-lg p-8 border border-border">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-light text-foreground">{store.name}</h3>
                    <div className="space-y-2 text-muted-foreground">
                      <p>{store.address}</p>
                      <p>{store.phone}</p>
                      <p>{store.hours}</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button variant="outline" className="rounded-none">
                        Как добраться
                      </Button>
                      <Button className="rounded-none">
                        Записаться
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-light text-foreground">Доступные услуги</h4>
                    <ul className="grid grid-cols-2 gap-2">
                      {store.services.map((service, serviceIndex) => (
                        <li key={serviceIndex} className="text-sm text-muted-foreground flex items-center">
                          <span className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></span>
                          {service}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ContentSection>

        <ContentSection title="Индивидуальные встречи">
          <div className="space-y-6">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Получите персональный сервис на приватной встрече. Наши консультанты проведут вас по коллекциям, помогут с индивидуальным дизайном и дадут экспертные рекомендации в комфортной обстановке.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="space-y-3">
                <h4 className="text-lg font-light text-foreground">Персональный шопинг</h4>
                <p className="text-muted-foreground text-sm">
                  Индивидуальная помощь в подборе украшения для любого случая
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="text-lg font-light text-foreground">Индивидуальный дизайн</h4>
                <p className="text-muted-foreground text-sm">
                  Совместно с нашими дизайнерами создайте уникальное изделие
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="text-lg font-light text-foreground">Экспертные услуги</h4>
                <p className="text-muted-foreground text-sm">
                  Профессиональная оценка, ремонт и обслуживание
                </p>
              </div>
            </div>
            
            <div className="pt-8">
              <Button size="lg" className="rounded-none">
                Запланировать встречу
              </Button>
            </div>
          </div>
        </ContentSection>

        <ContentSection title="Виртуальные консультации">
          <div className="bg-muted/10 rounded-lg p-8">
            <h3 className="text-xl font-light text-foreground mb-4">Не можете прийти лично?</h3>
            <p className="text-muted-foreground mb-6">
              Запишитесь на виртуальную консультацию с нашим экспертом. Мы покажем изделия по видеосвязи,
              ответим на вопросы и поможем выбрать подходящий вариант, не выходя из дома.
            </p>
            <Button variant="outline" className="rounded-none">
              Записаться онлайн
            </Button>
          </div>
        </ContentSection>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default StoreLocator;
