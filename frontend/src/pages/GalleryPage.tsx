import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import PageHero from '../components/landing/PageHero';
import GallerySection from '../components/landing/Gallery';
import PageLoader from '../components/PageLoader';

export default function GalleryPage() {
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
        console.error('Failed to load gallery records:', err);
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
        title="Our Gallery"
      />
      <GallerySection galleryImages={galleryImages} />
    </div>
  );
}
