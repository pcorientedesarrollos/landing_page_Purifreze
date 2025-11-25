export const SEO_CONFIG = {
  business: {
    name: "Purifreze",
    legalName: "Purifreze",
    foundingDate: "2020-01-01", // Estimado, ajustar si es necesario
    description: "Renta de sistemas de purificación de agua por ósmosis inversa con instalación y mantenimiento incluido en Mérida, Yucatán. Olvídate de los garrafones.",
    url: "https://purifreze.mx",
    logo: "/assets/nombre-logo.png",
    contact: {
      phone: "+52-999-133-6108",
      whatsapp: "https://wa.me/5219991336108",
      email: "contacto@purifreze.com", // Asumido, verificar
      address: {
        streetAddress: "Nuevo Yucatán",
        addressLocality: "Mérida",
        addressRegion: "Yucatán",
        addressCountry: "MX",
        postalCode: "97147"
      },
      geo: {
        latitude: "20.9990914",
        longitude: "-89.5807136"
      }
    },
    social: {
      facebook: "https://www.facebook.com/purifreze",
      instagram: "https://www.instagram.com/purifreze" // Asumido
    },
    openingHours: [
      "Mo-Fr 08:00-18:00",
      "Sa 08:00-14:00"
    ]
  },
  keywords: {
    primary: [
      "purificador de agua mérida",
      "renta de purificadores de agua",
      "osmosis inversa mérida",
      "agua purificada a domicilio",
      "filtro de agua mérida"
    ],
    secondary: [
      "mantenimiento de purificadores",
      "instalación de filtros de agua",
      "agua alcalina mérida",
      "dispensador de agua oficina",
      "purificador de agua casa",
      "agua",
      "filtros",
      "purificar",
      "limpio",
      "agua limpia",
      "purificar agua"
    ],
    longTail: [
      "renta de purificador de agua con mantenimiento incluido",
      "mejor sistema de purificación de agua en mérida",
      "alternativa a garrafones de agua en mérida",
      "purificador de agua sin costo de instalación",
      "agua purificada ilimitada para oficinas"
    ]
  },
  services: [
    "Renta de Purificadores Residenciales",
    "Renta de Purificadores Comerciales",
    "Mantenimiento de Sistemas de Ósmosis Inversa",
    "Instalación de Filtros de Agua"
  ]
};

export const getSEOTitle = (pageTitle?: string) => {
  const baseTitle = "Purifreze - Purificador de Agua en Mérida | Renta y Mantenimiento";
  return pageTitle ? `${pageTitle} | Purifreze` : baseTitle;
};

export const getMetaDescription = (pageDescription?: string) => {
  return pageDescription || SEO_CONFIG.business.description;
};

export const getSchemaJSON = () => {
  const { business, services } = SEO_CONFIG;

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": business.url,
    "name": business.name,
    "image": [
      `${business.url}${business.logo}`,
      `${business.url}/assets/Casa.png`,
      `${business.url}/assets/Oficina.png`
    ],
    "description": business.description,
    "url": business.url,
    "telephone": business.contact.phone,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": business.contact.address.streetAddress,
      "addressLocality": business.contact.address.addressLocality,
      "addressRegion": business.contact.address.addressRegion,
      "postalCode": business.contact.address.postalCode,
      "addressCountry": business.contact.address.addressCountry
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": business.contact.geo.latitude,
      "longitude": business.contact.geo.longitude
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "08:00",
      "closes": "18:00"
    },
    "sameAs": [
      business.social.facebook,
      business.social.instagram
    ],
    "priceRange": "$$",
    "areaServed": {
      "@type": "City",
      "name": "Mérida"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Servicios de Purificación",
      "itemListElement": services.map(service => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": service
        }
      }))
    }
  });
};
