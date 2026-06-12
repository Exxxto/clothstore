import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import AboutSidebar from "../../components/about/AboutSidebar";

const MEN_SIZE_TABLE = [
  { size: "S", chest: "92–96", waist: "78–82", hips: "94–98" },
  { size: "M", chest: "97–101", waist: "83–87", hips: "99–103" },
  { size: "L", chest: "102–106", waist: "88–93", hips: "104–108" },
  { size: "XL", chest: "107–112", waist: "94–99", hips: "109–114" },
  { size: "XXL", chest: "113–118", waist: "100–106", hips: "115–120" },
];

const MEN_JEANS_TABLE = [
  { size: "28", waist_cm: "71–74", height: "170–175" },
  { size: "30", waist_cm: "76–79", height: "175–180" },
  { size: "32", waist_cm: "81–84", height: "180–185" },
  { size: "34", waist_cm: "86–89", height: "185–190" },
  { size: "36", waist_cm: "91–94", height: "190–195" },
];

const WOMEN_SIZE_TABLE = [
  { size: "XS", chest: "80–84", waist: "62–66", hips: "88–92", ru: "40" },
  { size: "S", chest: "85–89", waist: "67–71", hips: "93–97", ru: "42" },
  { size: "M", chest: "90–94", waist: "72–76", hips: "98–102", ru: "44–46" },
  { size: "L", chest: "95–99", waist: "77–82", hips: "103–107", ru: "48" },
  { size: "XL", chest: "100–105", waist: "83–88", hips: "108–113", ru: "50" },
];

const WOMEN_JEANS_TABLE = [
  { size: "24", waist_cm: "61–64", height: "160–165" },
  { size: "26", waist_cm: "65–68", height: "165–170" },
  { size: "28", waist_cm: "69–72", height: "170–175" },
  { size: "30", waist_cm: "73–76", height: "175–180" },
  { size: "32", waist_cm: "77–80", height: "180–185" },
];

const KIDS_SIZE_TABLE = [
  { ru: "104", height_cm: "99–104", age: "3–4" },
  { ru: "110", height_cm: "105–110", age: "4–5" },
  { ru: "116", height_cm: "111–116", age: "5–6" },
  { ru: "122", height_cm: "117–122", age: "6–7" },
  { ru: "128", height_cm: "123–128", age: "7–8" },
];

const SHOE_SIZE_TABLE = [
  { ru: "36", foot_cm: "23.0" },
  { ru: "37", foot_cm: "23.8" },
  { ru: "38", foot_cm: "24.5" },
  { ru: "39", foot_cm: "25.1" },
  { ru: "40", foot_cm: "25.8" },
  { ru: "41", foot_cm: "26.5" },
  { ru: "42", foot_cm: "27.1" },
  { ru: "43", foot_cm: "27.8" },
  { ru: "44", foot_cm: "28.5" },
  { ru: "45", foot_cm: "29.1" },
];

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
            subtitle="Подберите идеальную посадку с помощью нашего подробного гида"
          />

          <ContentSection title="Мужская одежда">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-light text-foreground mb-4">Верхняя одежда, футболки, свитеры, худи</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted/20">
                        <th className="border border-border p-3 text-left font-light">Размер</th>
                        <th className="border border-border p-3 text-left font-light">Грудь (см)</th>
                        <th className="border border-border p-3 text-left font-light">Талия (см)</th>
                        <th className="border border-border p-3 text-left font-light">Бёдра (см)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MEN_SIZE_TABLE.map((row) => (
                        <tr key={row.size} className="hover:bg-muted/10">
                          <td className="border border-border p-3 font-medium">{row.size}</td>
                          <td className="border border-border p-3">{row.chest}</td>
                          <td className="border border-border p-3">{row.waist}</td>
                          <td className="border border-border p-3">{row.hips}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-light text-foreground mb-4">Джинсы и брюки</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted/20">
                        <th className="border border-border p-3 text-left font-light">Размер</th>
                        <th className="border border-border p-3 text-left font-light">Талия (см)</th>
                        <th className="border border-border p-3 text-left font-light">Рост (см)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MEN_JEANS_TABLE.map((row) => (
                        <tr key={row.size} className="hover:bg-muted/10">
                          <td className="border border-border p-3 font-medium">{row.size}</td>
                          <td className="border border-border p-3">{row.waist_cm}</td>
                          <td className="border border-border p-3">{row.height}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Женская одежда">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-light text-foreground mb-4">Верхняя одежда, платья, свитеры, юбки</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted/20">
                        <th className="border border-border p-3 text-left font-light">Размер</th>
                        <th className="border border-border p-3 text-left font-light">Грудь (см)</th>
                        <th className="border border-border p-3 text-left font-light">Талия (см)</th>
                        <th className="border border-border p-3 text-left font-light">Бёдра (см)</th>
                        <th className="border border-border p-3 text-left font-light">RU</th>
                      </tr>
                    </thead>
                    <tbody>
                      {WOMEN_SIZE_TABLE.map((row) => (
                        <tr key={row.size} className="hover:bg-muted/10">
                          <td className="border border-border p-3 font-medium">{row.size}</td>
                          <td className="border border-border p-3">{row.chest}</td>
                          <td className="border border-border p-3">{row.waist}</td>
                          <td className="border border-border p-3">{row.hips}</td>
                          <td className="border border-border p-3">{row.ru}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-light text-foreground mb-4">Джинсы и брюки</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted/20">
                        <th className="border border-border p-3 text-left font-light">Размер</th>
                        <th className="border border-border p-3 text-left font-light">Талия (см)</th>
                        <th className="border border-border p-3 text-left font-light">Рост (см)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {WOMEN_JEANS_TABLE.map((row) => (
                        <tr key={row.size} className="hover:bg-muted/10">
                          <td className="border border-border p-3 font-medium">{row.size}</td>
                          <td className="border border-border p-3">{row.waist_cm}</td>
                          <td className="border border-border p-3">{row.height}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Детская одежда">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/20">
                    <th className="border border-border p-3 text-left font-light">Размер (RU)</th>
                    <th className="border border-border p-3 text-left font-light">Рост (см)</th>
                    <th className="border border-border p-3 text-left font-light">Возраст</th>
                  </tr>
                </thead>
                <tbody>
                  {KIDS_SIZE_TABLE.map((row) => (
                    <tr key={row.ru} className="hover:bg-muted/10">
                      <td className="border border-border p-3 font-medium">{row.ru}</td>
                      <td className="border border-border p-3">{row.height_cm}</td>
                      <td className="border border-border p-3">{row.age}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContentSection>

          <ContentSection title="Обувь">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/20">
                    <th className="border border-border p-3 text-left font-light">Размер (RU)</th>
                    <th className="border border-border p-3 text-left font-light">Длина стопы (см)</th>
                  </tr>
                </thead>
                <tbody>
                  {SHOE_SIZE_TABLE.map((row) => (
                    <tr key={row.ru} className="hover:bg-muted/10">
                      <td className="border border-border p-3 font-medium">{row.ru}</td>
                      <td className="border border-border p-3">{row.foot_cm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContentSection>

          <ContentSection title="Как измерить">
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">Грудь:</strong> измеряется по самой выступающей точке, лента проходит горизонтально вокруг тела.
              </p>
              <p>
                <strong className="text-foreground">Талия:</strong> измеряется по самому узкому месту, лента свободно прилегает.
              </p>
              <p>
                <strong className="text-foreground">Бёдра:</strong> измеряется по самой широкой части, стоя с сомкнутыми ногами.
              </p>
              <p>
                <strong className="text-foreground">Длина стопы:</strong> измеряется от пятки до кончика самого длинного пальца, стоя на твёрдой поверхности.
              </p>
            </div>
          </ContentSection>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default SizeGuide;
