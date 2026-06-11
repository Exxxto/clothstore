import StatusBar from "./StatusBar";
import Navigation from "./Navigation";

const Header = () => {
  return (
    <header className="w-full sticky top-0 z-50">
      {/* <StatusBar /> */}
      <div className="relative overflow-visible border-b border-border/70 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background/90 to-muted/90" />
        <Navigation />
      </div>
    </header>
  );
};

export default Header;
