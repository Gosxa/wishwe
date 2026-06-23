import { Hero } from '../widgets/hero';
import { HowItWorks } from '../widgets/howItWorks';
import { WhyWishwe } from '../widgets/whyWishwe';
import { Waitlist } from '../widgets/waitlist';
import s from './landingPage.module.scss';

export const LandingPage = () => {
  return (
    <main className={s.page}>
      <Hero />
      <HowItWorks />
      <WhyWishwe />
      <Waitlist />
    </main>
  );
};
