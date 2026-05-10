import { NavLink } from 'react-router-dom';

const aboutPages = [
  { name: 'Наша история', path: '/about/our-story' },
  { name: 'Sustainability', path: '/about/sustainability' },
  { name: 'Гид по размерам', path: '/about/size-guide' },
  { name: 'Служба поддержки', path: '/about/customer-care' },
  { name: 'Наши магазины', path: '/about/store-locator' }
];

const AboutSidebar = () => {
  return (
    <aside className="hidden md:block w-64 sticky top-32 h-fit px-6">
      <nav className="space-y-1">
        <h3 className="text-lg font-light text-foreground mb-6">О бренде</h3>
        {aboutPages.map((page) => (
          <NavLink
            key={page.path}
            to={page.path}
            className={({ isActive }) =>
              `block py-2 text-sm font-light transition-all ${
                isActive
                  ? 'text-primary underline decoration-2 underline-offset-4'
                  : 'text-muted-foreground hover:text-foreground hover:underline hover:decoration-1 hover:underline-offset-4'
              }`
            }
          >
            {page.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default AboutSidebar;
