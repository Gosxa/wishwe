import Link from 'next/link';
import { Logo } from '@shared/ui/icons';
import s from './privacyPolicyPage.module.scss';

const sections = [
  'Who Does This Privacy Policy Apply To?',
  'What Information Do We Collect?',
  'Data Accuracy',
  'How and Why We Use Your Information',
  'Sharing Your Information',
  'Third-Party Links and Services',
  'How Long Is Your Information Kept?',
  'How Do We Secure Your Information?',
  'Where Is Your Information Processed?',
  'Children and Young Users',
  'Updates to This Policy',
  'Contact Us',
];

const collectedInformation = [
  'Profile details you provide when you create an account, such as your name, age, gender, interests, bio, city, profile photo, and email address.',
  'Sign-up and login information. You can register using an email address and password, or via Google, Facebook, or Apple sign-in, in which case we receive the basic profile information those providers share with us (such as your name, email address, and profile photo).',
  'Content related to Wishes and Plans, such as the Wishes you create or join, Plans you create or participate in, proposed times, RSVPs, invited participants, and any photos you choose to attach to a Wish or Plan.',
  'Friend connections, including connections made through the QR feature and the privacy settings you choose for each Wish or Plan (for example, visible to your inner circle only, or open to new friends).',
  'Device and technical data that your device automatically provides when you use the App or visit the Website, such as device ID, IP address, operating system, browser type, and time zone.',
  'Usage data about how you interact with the App or the Website — for example, which features you use and how you navigate the App or the Website — collected through analytics tools.',
  'Location data, only if you choose to enable a feature that relies on your device’s location.',
  'Communications you send us, for example when you contact us with a question or request.',
  'Sensitive personal information, only if you choose to include it yourself — for example in your bio. If you voluntarily share sensitive information (such as details about your health, religion, or political views) in the App or in the Website, this constitutes your explicit consent to our processing of that information. You can edit or remove it at any time.',
];

const useCases: Array<[string, string]> = [
  [
    'To register you and let you use WishWe’s features (create a profile, add friends, create and join Wishes or Plans).',
    'Profile details, contact details, usage data',
  ],
  [
    'To let you create and manage “Wishes”, “Plans”, invite friends, and manage RSVPs.',
    'Profile details, contact details, usage data, plan/event content',
  ],
  [
    'To operate the QR connection feature so you can add friends without sharing your phone number.',
    'Profile details, device data, usage data',
  ],
  [
    'To send you service communications and notifications relevant to your Wishes, Plans and account.',
    'Contact details, preferences, device data',
  ],
  [
    'To understand how WishWe is used and to improve the app, using analytics tools.',
    'Usage data, device data, aggregated data',
  ],
  [
    'To maintain the security of WishWe and prevent misuse, fraud, or abuse.',
    'Usage data, device data, security logs',
  ],
  [
    'To comply with the law or to establish, exercise, or defend legal claims.',
    'Any information required for the specific legal purpose',
  ],
];

const sharingRecipients = [
  'service providers who help us run WishWe, such as our hosting and infrastructure providers;',
  'our analytics providers, which help us understand app usage (see Section 2);',
  'authorities or other parties, where we are required to do so by law; and',
  'a successor entity, if WishWe is ever transferred, merged, or acquired.',
];

export const PrivacyPolicyPage = () => (
  <div className={s.shell}>
    <header className={s.header}>
      <Link href="/" aria-label="WishWe home">
        <Logo height={36} />
      </Link>
    </header>
    <main className={s.main} id="top">
      <header className={s.hero}>
        <p className={s.eyebrow}>WISHWE · YOUR PRIVACY</p>
        <h1>Privacy Policy</h1>
        <p className={s.updated}>Last updated: August 2026</p>
        <p className={s.lead}>
          This Privacy Policy explains how WishWe (“WishWe”, “we”, “us”,
          “our”) processes your personal information (“you”, “your”) when you
          use the WishWe mobile application (the “App”), visit our website (the
          “Website”), or otherwise interact with our services.
        </p>
        <p className={s.notice}>
          Please read this Privacy Policy carefully. By creating an account or
          otherwise using our Services, you acknowledge that you have read and
          understood this Privacy Policy.
        </p>
        <p className={s.lead}>
          WishWe is currently a small, independently run project without a
          registered company. References to “we”, “us”, and “our” refer to the
          person(s) operating WishWe. You can reach us using the contact details
          in the “Contact Us” section below.
        </p>
      </header>

      <div className={s.layout}>
        <nav className={s.contents} aria-label="Privacy policy sections">
          <p>On this page</p>
          <ol>
            {sections.map((section, index) => (
              <li key={section}>
                <a href={`#section-${index + 1}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {section}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className={s.document}>
          <section id="section-1" className={s.section}>
            <SectionTitle number={1} title={sections[0]} />
            <p>This policy applies to:</p>
            <ul>
              <li>
                everyone who creates a WishWe account and uses the App or
                visits our website; and
              </li>
              <li>
                anyone who contacts us directly, including by email or
                messaging apps.
              </li>
            </ul>
          </section>

          <section id="section-2" className={s.section}>
            <SectionTitle number={2} title={sections[1]} />
            <p>
              “Personal information” or “personal data” refers to any
              information that identifies you or relates to you. We process the
              following categories of information:
            </p>
            <ul>
              {collectedInformation.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>
              WishWe does not access your phone contacts, and does not integrate
              with Instagram or any other social media platform beyond the
              sign-in options listed above. WishWe does not include in-app
              messaging — if you want to chat with friends, you can share an
              external link (such as Telegram or WhatsApp) instead.
            </p>
          </section>

          <section id="section-3" className={s.section}>
            <SectionTitle number={3} title={sections[2]} />
            <p>
              We rely on the information you provide as accurate, complete,
              and up to date. Please let us know if any of your details change.
            </p>
          </section>

          <section id="section-4" className={s.section}>
            <SectionTitle number={4} title={sections[3]} />
            <p>
              We use your personal information for the purposes described
              below, to operate WishWe and provide you with its features.
            </p>
            <div className={s.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Purpose</th>
                    <th>Personal information used</th>
                  </tr>
                </thead>
                <tbody>
                  {useCases.map(([purpose, data]) => (
                    <tr key={purpose}>
                      <td>{purpose}</td>
                      <td>{data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="section-5" className={s.section}>
            <SectionTitle number={5} title={sections[4]} />
            <p>We do not sell your personal information. We may share it with:</p>
            <ul>
              {sharingRecipients.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>
              Other WishWe users can see the profile details and Wish content
              you choose to share with them, based on the privacy settings you
              select for each Wish.
            </p>
          </section>

          <section id="section-6" className={s.section}>
            <SectionTitle number={6} title={sections[5]} />
            <p>
              WishWe may let you share external links to third-party chat
              services (such as Telegram or WhatsApp) so you can continue
              conversations outside WishWe. We do not control these third-party
              services and are not responsible for how they process your
              information. Please check their own privacy policies before using
              them.
            </p>
          </section>

          <section id="section-7" className={s.section}>
            <SectionTitle number={7} title={sections[6]} />
            <p>
              We keep your personal information only for as long as your
              account is active. If you delete your account, we delete your
              personal information at that time, except where we are required
              to keep certain information for a longer period to comply with
              the law, resolve disputes, or enforce our agreements.
            </p>
          </section>

          <section id="section-8" className={s.section}>
            <SectionTitle number={8} title={sections[7]} />
            <p>
              We take reasonable organizational and technical measures to help
              protect your personal information against unauthorized access,
              loss, misuse, or alteration. We aim to use no more personal
              information than is necessary for each purpose described above.
            </p>
          </section>

          <section id="section-9" className={s.section}>
            <SectionTitle number={9} title={sections[8]} />
            <p>
              Your information may be processed in countries other than the one
              where you live, including where our service providers (such as
              our analytics providers) are based. Where this happens, we take
              reasonable steps to ensure your information continues to be
              treated securely and in line with this Privacy Policy.
            </p>
          </section>

          <section id="section-10" className={s.section}>
            <SectionTitle number={10} title={sections[9]} />
            <p>
              WishWe does not currently restrict use of the App by age. If you
              are using WishWe on behalf of, or together with, a younger family
              member, please make sure they understand what information they
              are sharing and with whom. If you believe a child has shared
              personal information with us in a way that concerns you, please
              contact us and we will look into it.
            </p>
          </section>

          <section id="section-11" className={s.section}>
            <SectionTitle number={11} title={sections[10]} />
            <p>
              If we make changes to this Privacy Policy, we will update it on
              this page and revise the “Last updated” date above. If you
              continue to use WishWe after changes are posted, this means you
              accept the updated policy. If any changes significantly affect
              you, we will seek your consent where required by law.
            </p>
            <p>
              You may delete your account and associated data at any time by
              contacting us at the email address below.
            </p>
          </section>

          <section id="section-12" className={s.section}>
            <SectionTitle number={12} title={sections[11]} />
            <p>
              If you have any questions or concerns about how we use your
              personal information, please email us at:
            </p>
            <p>
              <a href="mailto:wishwe.service@gmail.com">
                wishwe.service@gmail.com
              </a>
            </p>
          </section>

          <a className={s.backToTop} href="#top">
            <span>Back to top</span>
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M3 21 12 12l9 9h-4l-5-5-5 5H3Z" />
                <path d="M3 15 12 6l9 9h-4l-5-5-5 5H3Z" />
                <path d="M3 9 12 0l9 9h-4l-5-5-5 5H3Z" />
              </svg>
            </span>
          </a>
        </article>
      </div>
    </main>
  </div>
);

const SectionTitle = ({ number, title }: { number: number; title: string }) => (
  <h2>
    <span>{String(number).padStart(2, '0')}</span>
    {title}
  </h2>
);
