interface Store {
  name: string;
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
}

const stores: Store[] = [
  {
    name: "Силуэт на Тверской",
    address: "г. Москва, ул. Тверская, д. 1",
    phone: "+7 (863) 555-01-23",
    hours: "Пн-Сб: 10:00-20:00, Вс: 12:00-18:00",
    lat: 55.7617,
    lng: 37.6073
  },
  {
    name: "Силуэт Арбат",
    address: "г. Москва, ул. Арбат, д. 10",
    phone: "+7 (863) 555-04-56",
    hours: "Пн-Сб: 10:00-20:00, Вс: 12:00-18:00",
    lat: 55.7520,
    lng: 37.5921
  },
  {
    name: "Силуэт Невский",
    address: "г. Санкт-Петербург, Невский пр., д. 50",
    phone: "+7 (863) 555-07-89",
    hours: "Пн-Сб: 11:00-20:00, Вс: 12:00-19:00",
    lat: 59.9311,
    lng: 30.3609
  }
];

const StoreMap = () => {
  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-border bg-muted/10 relative">
      {/* Static Map using Google Maps Embed API */}
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12063.046788464958!2d-74.0059413!3d40.7489054!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b3117469%3A0xd134e199a405a163!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sus!4v1641234567890!5m2!1sen!2sus"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full h-full"
      />
      
      {/* Overlay with store markers */}
      <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-4 max-w-xs">
        <h4 className="text-sm font-medium text-foreground mb-3">Our Locations</h4>
        <div className="space-y-2">
          {stores.map((store, index) => (
            <div key={index} className="text-xs">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                <span className="font-medium text-foreground">{store.name}</span>
              </div>
              <p className="text-muted-foreground ml-4">{store.address}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoreMap;