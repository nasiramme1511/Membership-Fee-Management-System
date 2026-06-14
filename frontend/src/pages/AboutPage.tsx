import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import PageHero from '../components/landing/PageHero';
import AboutSection from '../components/landing/About';
import Leadership from '../components/landing/Leadership';
import PageLoader from '../components/PageLoader';

export default function AboutPage() {
  const { t } = useTranslation();
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const contentRes = await api.get('/landing/content');
        if (contentRes.data.success) {
          setContent(contentRes.data.data.content || {});
          setGalleryImages(contentRes.data.data.images || []);
        }
      } catch (err) {
        console.error('Failed to load about page records:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <PageLoader />;

  const leadershipImages = galleryImages.filter((i: any) => i.category === 'leadership');
  const leaderImg = leadershipImages.length > 0 ? leadershipImages[0].image : '/photos/leadership.jpg';
  const aboutImg = '/about1.png';

  return (
    <div>
      <PageHero
        title={content.about_title || t('landing.about_label')}
      />
      <AboutSection content={content} aboutImg={aboutImg} />
      <Leadership content={content} leaderImg={leaderImg} />
    </div>
  );
}
