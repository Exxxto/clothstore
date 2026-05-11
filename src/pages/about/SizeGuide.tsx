import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import { Button } from "../../components/ui/button";
import AboutSidebar from "../../components/about/AboutSidebar";

const SizeGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>
        
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
        <PageHeader 
          title="Гид по размерам" 
          subtitle="Подберите идеальную посадку с помощью нашего подробного гида по размерам"
        />
        
        <ContentSection title="Размеры колец">
          <div className="space-y-8">
            <div className="bg-muted/10 rounded-lg p-8">
              <h3 className="text-xl font-light text-foreground mb-6">Как измерить размер кольца</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Способ 1: с помощью кольца, которое у вас уже есть</h4>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Возьмите кольцо, которое удобно сидит на нужном пальце</li>
                    <li>Положите его на линейку и измерьте внутренний диаметр в миллиметрах</li>
                    <li>Сопоставьте результат с таблицей размеров ниже</li>
                  </ol>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Способ 2: с помощью нитки или бумаги</h4>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Оберните нитку или полоску бумаги вокруг пальца в месте посадки кольца</li>
                    <li>Отметьте место, где материал накладывается сам на себя</li>
                    <li>Измерьте длину в миллиметрах</li>
                    <li>Разделите на 3,14, чтобы получить диаметр</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/20">
                    <th className="border border-border p-3 text-left font-light">Размер US</th>
                    <th className="border border-border p-3 text-left font-light">Размер UK</th>
                    <th className="border border-border p-3 text-left font-light">Размер EU</th>
                    <th className="border border-border p-3 text-left font-light">Диаметр (мм)</th>
                    <th className="border border-border p-3 text-left font-light">Окружность (мм)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { us: "5", uk: "J", eu: "49", diameter: "15.6", circumference: "49.0" },
                    { us: "5.5", uk: "K", eu: "50", diameter: "16.0", circumference: "50.2" },
                    { us: "6", uk: "L", eu: "51", diameter: "16.4", circumference: "51.5" },
                    { us: "6.5", uk: "M", eu: "52", diameter: "16.8", circumference: "52.8" },
                    { us: "7", uk: "N", eu: "54", diameter: "17.2", circumference: "54.0" },
                    { us: "7.5", uk: "O", eu: "55", diameter: "17.6", circumference: "55.3" },
                    { us: "8", uk: "P", eu: "56", diameter: "18.0", circumference: "56.5" },
                    { us: "8.5", uk: "Q", eu: "57", diameter: "18.4", circumference: "57.8" },
                    { us: "9", uk: "R", eu: "59", diameter: "18.8", circumference: "59.1" }
                  ].map((size, index) => (
                    <tr key={index} className="hover:bg-muted/10">
                      <td className="border border-border p-3">{size.us}</td>
                      <td className="border border-border p-3">{size.uk}</td>
                      <td className="border border-border p-3">{size.eu}</td>
                      <td className="border border-border p-3">{size.diameter}</td>
                      <td className="border border-border p-3">{size.circumference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ContentSection>

        <ContentSection title="Нужна помощь?">
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Всё ещё сомневаетесь в размере? Наши консультанты помогут подобрать идеальную посадку.
              Скачайте наш гид в PDF или запишитесь на виртуальную консультацию.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="rounded-none">
                Скачать гид в PDF
              </Button>
              <Button className="rounded-none">
                Записаться на консультацию
              </Button>
            </div>
          </div>
        </ContentSection>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default SizeGuide;
