import { Screen } from '../../ui';
import { EnterEmailContent } from './ui/EnterEmailContent';

const config = {
  index: 1,
  h2: 'Enter your email',
  headline: `We'll get you started or sign you back in.`,
};

export const EnterEmail = () => (
  <Screen {...config}>
    <EnterEmailContent />
  </Screen>
);
