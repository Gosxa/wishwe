import { Hero } from '../widgets/hero';
import { HowItWorks } from '../widgets/howItWorks';
import { WhyWishwe } from '../widgets/whyWishwe';
import s from './landingPage.module.scss';

export const LandingPage = () => {
  return (
    <main className={s.page}>
      <Hero />
      <HowItWorks />
      <WhyWishwe />
    </main>
  );
};
