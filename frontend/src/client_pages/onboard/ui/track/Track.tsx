'use client';

import { useTrackContext, SCREEN_ID } from '../../model';
import s from './track.module.scss';
import {
  CreatePasswordForm,
  DoneScreen,
  EnterEmail,
  EnterPasswordForm,
  InviteRequestSent,
  LoginScreen,
  PersonalDataForm,
  VerifyEmail,
} from '../../widgets';
import { cloneElement, useEffect, useRef, useState } from 'react';
import type { InviteContext } from '../../model/screensConfig';

const VIEWPORT_PADDING = 8;

type Props = {
  invite?: InviteContext;
};

export const Track = ({ invite }: Props) => {
  const { screenStack, pointer, setScreenStack } = useTrackContext();
  const trackRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const screens = {
    [SCREEN_ID.LOGIN_SCREEN]: <LoginScreen invite={invite} />,
    [SCREEN_ID.ENTER_EMAIL]: <EnterEmail />,
    [SCREEN_ID.VERIFY_REGISTER]: <VerifyEmail variant="register" />,
    [SCREEN_ID.VERIFY_RESET]: <VerifyEmail variant="reset" />,
    [SCREEN_ID.ENTER_PWD]: <EnterPasswordForm />,
    [SCREEN_ID.CREATE_PWD]: <CreatePasswordForm variant="register" />,
    [SCREEN_ID.RESET_PWD]: <CreatePasswordForm variant="reset" />,
    [SCREEN_ID.PERSONAL_GOOGLE]: <PersonalDataForm variant="google" />,
    [SCREEN_ID.PERSONAL_MAIL]: <PersonalDataForm variant="email" />,
    [SCREEN_ID.DONE_ONBOARD]: <DoneScreen variant="create" />,
    [SCREEN_ID.DONE_RESET]: <DoneScreen variant="reset" />,
    [SCREEN_ID.INVITE_REQUEST_SENT]: <InviteRequestSent />,
  };

  useEffect(() => {
    const active = trackRef.current?.children[pointer];

    if (!(active instanceof HTMLElement)) return;

    const measure = () =>
      setViewportHeight(
        Math.ceil(active.getBoundingClientRect().height) + VIEWPORT_PADDING,
      );

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(active);

    return () => observer.disconnect();
  }, [pointer, screenStack]);

  const onTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== 'transform' || e.target !== e.currentTarget) return;

    setScreenStack(prev =>
      prev.length > pointer + 1 ? prev.slice(0, pointer + 1) : prev,
    );
  };

  const cssVars = {
    '--pointer': String(pointer),
    ...(viewportHeight !== null && {
      '--viewport-height': `${viewportHeight}px`,
    }),
  } as React.CSSProperties;

  return (
    <div className={s.inner} style={cssVars}>
      <div className={s.viewport}>
        <div
          ref={trackRef}
          className={s.track}
          onTransitionEnd={onTransitionEnd}
        >
          {screenStack.map(id => cloneElement(screens[id], { key: id }))}
        </div>
      </div>
    </div>
  );
};
