import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import ImageTextBlock from "../../components/about/ImageTextBlock";
import AboutSidebar from "../../components/about/AboutSidebar";

const OurStory = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>
        
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
          <PageHeader 
            title="Наша история" 
            subtitle="Путь через страсть, мастерство и вневременную элегантность"
          />
          
          <ContentSection>
            <ImageTextBlock
              image="/founders.png"
              imageAlt="Основатели компании"
              title="Основано на страсти"
              content="Силуэт был рождён из общего видения — создавать вневременные украшения, выходящие за рамки мимолётных трендов. Наши основатели, объединённые страстью к исключительному мастерству и устойчивым практикам, основали бренд с обязательством создавать украшения, которые рассказывают историю — вашу историю."
              imagePosition="left"
            />
          </ContentSection>

          <ContentSection title="Наше наследие">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-xl font-light text-foreground">Традиционное мастерство</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Каждое изделие в нашей коллекции тщательно создаётся вручную опытными мастерами, оттачивавшими ремесло поколениями. Мы бережно сохраняем традиционные техники и при этом используем современные решения, чтобы каждое изделие соответствовало нашим строгим стандартам качества и красоты.
                </p>
              </div>
              <div className="space-y-6">
                <h3 className="text-xl font-light text-foreground">Устойчивое будущее</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Мы уверены, что роскошь и устойчивость могут прекрасно сосуществовать. Наш подход к этичным поставкам, переработанным материалам и ответственному производству делает каждое изделие вкладом в более устойчивое будущее.
                </p>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Наши ценности">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Совершенство</h3>
                <p className="text-muted-foreground">
                  Мы стремимся к совершенству в каждой детали, от первой идеи до финальной полировки.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Подлинность</h3>
                <p className="text-muted-foreground">
                  Каждое изделие отражает настоящее мастерство и рассказывает подлинную историю ремесла и заботы.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Инновации</h3>
                <p className="text-muted-foreground">
                  Мы постоянно развиваем дизайн и технологии, сохраняя вечные эстетические принципы.
                </p>
              </div>
            </div>
          </ContentSection>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default OurStory;
