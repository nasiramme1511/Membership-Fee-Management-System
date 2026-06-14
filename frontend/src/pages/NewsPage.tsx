import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import PageHero from '../components/landing/PageHero';
import NewsSection from '../components/landing/News';
import PageLoader from '../components/PageLoader';

export default function NewsPage() {
  const { t } = useTranslation();
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const contentRes = await api.get('/landing/content');
        if (contentRes.data.success) {
          setGalleryImages(contentRes.data.data.images || []);
        }
      } catch (err) {
        console.error('Failed to load news records:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHero
        title="News & Announsment"
      />
      <NewsSection galleryImages={galleryImages} />
    </div>
  );
}
