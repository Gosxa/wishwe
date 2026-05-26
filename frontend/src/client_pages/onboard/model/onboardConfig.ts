const personalDataGoogle = {
  h1: 'Is this you?',
  heading: `We've pulled your info from Google. Make sure it looks right before joining the circle`,
};

const personalData = {
  h1: 'Complete your profile',
  heading: `Choose how you'll appear to your friends before joining the circle`,
};

const loginProps = {
  h1: 'Get together, finally',
  heading: 'No random people. No noise. Just you and your inner circle',
};

const emailProps = {
  h1: 'Enter your email',
  heading: `Well get you started or sign you back in.`,
};

const doneProps = {
  h1: `Welcome aboard, \n@`,
  heading:
    'Wish.we is all about sharing moment with your inner circle. Add your friends now to see what they are planning.',
};

const screenProps = {
  login: loginProps,
  email: emailProps,
  personalDataGoogle: personalDataGoogle,
  personalData: personalData,
  done: doneProps,
} as const;

export { screenProps };
