import { useTranslation } from 'react-i18next';
import PageHero from '../components/landing/PageHero';
import FeaturesSection from '../components/landing/Features';
import Trust from '../components/landing/Trust';

export default function FeaturesPage() {
  const { t } = useTranslation();

  return (
    <div>
      <PageHero
        title="System Feature"
      />
      <FeaturesSection />
      <Trust />
    </div>
  );
}
