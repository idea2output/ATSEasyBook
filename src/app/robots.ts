import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/data/'],
    },
    sitemap: 'http://localhost:3008/sitemap.xml',
  };
}
