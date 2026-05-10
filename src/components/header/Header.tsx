import StatusBar from "./StatusBar";
import Navigation from "./Navigation";

const Header = () => {
  return (
    <header className="w-full sticky top-0 z-50">
      {/* <StatusBar /> */}
      <div className="relative overflow-visible border-b border-border/70 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.88),rgba(247,247,245,0.9))]" />
        <Navigation />
      </div>
    </header>
  );
};

export default Header;
