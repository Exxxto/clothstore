import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import HeroSection from "../components/content/HeroSection";
import CategoryCards from "../components/content/CategoryCards";
import ProductCarousel from "../components/content/ProductCarousel";
import SeasonalBanner from "../components/content/SeasonalBanner";
import FittingRoomBanner from "../components/content/FittingRoomBanner";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <HeroSection />
        <CategoryCards />
        <ProductCarousel />
        <SeasonalBanner />
        <FittingRoomBanner />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
