import { useI18n } from '@blufountain/i18n/react';
import { MATTERS } from '@blufountain/public-kit';
import { CtaBand, Faq, PageHead, Section } from './parts';
import { OFFICE_PHONE, type SiteView } from './SiteLayout';

const MATTER_DETAIL: Record<(typeof MATTERS)[number], string> = {
  criminal_defence:
    'If you have been arrested or charged, a lawyer makes sure your rights are respected, explains the charge and speaks for you in court.',
  family_maintenance:
    'Help to ask for, or respond to, child support and family maintenance, and to settle family disputes fairly.',
  inheritance_estates:
    'Guidance when someone dies: who inherits, how an estate is wound up, and how to protect a widow, widower or children.',
  labour:
    'Dismissed without notice, unpaid wages, or an unsafe workplace. A lawyer helps you claim what you are owed.',
  land_eviction:
    'Told to leave your home or land? A lawyer checks the order is lawful and defends your right to stay.',
  protection_order_gbv:
    'Help to get a protection order and stay safe. Your case is handled privately and with care.',
};

function Services() {
  const { t } = useI18n();
  return (
    <>
      <PageHead
        eyebrow="Services"
        title="What we do, exactly."
        photo={{ name: 'lawyer', alt: 'A lawyer listens to a client explain his problem.' }}
        facts={[
          ['Legal aid', 'Free when you cannot pay'],
          ['Legal cover', 'A small monthly premium'],
          ['Areas of law', 'Six, from work to family'],
        ]}
        jump={[
          ['aid', 'Legal aid'],
          ['matters', 'Areas we help with'],
          ['cover', 'Legal cover'],
        ]}
        action={{ label: t('home.apply'), href: '#/apply' }}
      >
        Two services, one team. Both start with a conversation, and both end with a lawyer working
        for you.
      </PageHead>
      <Section id="aid" eyebrow="Legal aid" title="Free help when you cannot pay.">
        <p className="s-sub">
          Ask for help in a few minutes. We call you, listen, and decide with you whether we can
          take your case. If we cannot, we tell you where else to go.
        </p>
        <ul className="s-ticks">
          <li>Tell us what happened in your own words</li>
          <li>A person calls you within one working day</li>
          <li>A lawyer reviews your case and explains your options</li>
          <li>Follow the stage, the next court date and your lawyer online</li>
        </ul>
        <div className="s-actions">
          <a className="s-btn s-primary" href="#/apply">
            {t('home.apply')}
          </a>
          <a className="s-link" href="#/check">
            {t('home.check')} ›
          </a>
        </div>
      </Section>
      <Section
        id="matters"
        tone="soft"
        eyebrow="Kinds of problems"
        title="Six areas where we help."
      >
        <div className="s-cards s-two reveal">
          {MATTERS.map((m) => (
            <article key={m} className="s-card">
              <h3>{t(`matter.${m}`)}</h3>
              <p>{MATTER_DETAIL[m]}</p>
            </article>
          ))}
        </div>
      </Section>
      <Section id="cover" eyebrow="Legal cover" title="A lawyer on call, all year.">
        <p className="s-sub">
          Members pay a small monthly premium. When a legal problem comes, you claim help instead of
          finding money. Each kind of problem has a start date, and your portal shows it.
        </p>
        <a className="s-link" href="#/membership">
          How membership works ›
        </a>
      </Section>
      <CtaBand />
    </>
  );
}

function Serve() {
  const groups: [string, string][] = [
    ['Workers', 'Lost your job or not been paid? We help you claim what you are owed.'],
    [
      'Families',
      'Child support, a death in the family, or a dispute at home. We help you settle it fairly.',
    ],
    [
      'Tenants and land holders',
      'Facing eviction or a land dispute? We defend your right to stay.',
    ],
    ['People charged with a crime', 'You have the right to a lawyer. We make sure you have one.'],
    ['Survivors of violence', 'We help you get a protection order, privately and with care.'],
    [
      'Households on low incomes',
      'If you cannot pay for a lawyer, ask for legal aid. That is why we exist.',
    ],
  ];
  return (
    <>
      <PageHead
        eyebrow="Who we serve"
        title="For people who cannot afford to wait."
        photo={{ name: 'market', alt: 'A young woman at a market types a message on her phone.' }}
        facts={[
          ['Who', 'Workers, families, tenants'],
          ['Languages', 'English, Shona, isiNdebele'],
          ['Payments', 'EcoCash or OneMoney'],
        ]}
        jump={[
          ['groups', 'People we help'],
          ['access', 'Easy to reach'],
        ]}
      >
        Legal trouble does not wait for a good month. We serve the people who need a lawyer most and
        can least afford one.
      </PageHead>
      <Section id="groups" eyebrow="People we help" title="You are not alone in this.">
        <div className="s-cards s-three reveal">
          {groups.map(([h, p]) => (
            <article key={h} className="s-card">
              <h3>{h}</h3>
              <p>{p}</p>
            </article>
          ))}
        </div>
      </Section>
      <Section
        id="access"
        tone="soft"
        eyebrow="Made to be reached"
        title="Easy to use on any phone."
      >
        <ul className="s-ticks">
          <li>Works on basic phones and slow connections</li>
          <li>Available in English, Shona and isiNdebele</li>
          <li>Pay by EcoCash or OneMoney, no bank account needed</li>
          <li>Short, plain sentences. Nothing to decode</li>
        </ul>
      </Section>
      <CtaBand title="Not sure if we can help? Ask." />
    </>
  );
}

function How() {
  const { t } = useI18n();
  const steps: [string, string][] = [
    ['Ask', 'Send a short request from your phone. Say what happened and how to reach you.'],
    ['We call', 'Within one working day a member of our team calls, listens and checks the facts.'],
    [
      'We decide with you',
      'We explain whether legal aid or cover applies and what the next step is.',
    ],
    [
      'A lawyer takes your case',
      'You get a named lawyer. They work on your case and tell you what is happening.',
    ],
    [
      'You follow along',
      'Check the stage and the next court date online, any time, with a code sent to your phone.',
    ],
  ];
  return (
    <>
      <PageHead
        eyebrow={t('home.how')}
        title="From first call to a lawyer."
        photo={{
          name: 'helpdesk',
          alt: 'A smiling member of our team takes a call at the help desk.',
        }}
        facts={[
          ['Asking', 'About five minutes'],
          ['First call', 'Within one working day'],
          ['Following', 'Online, any time'],
        ]}
        jump={[
          ['steps', 'The five steps'],
          ['prepare', 'What to have ready'],
        ]}
        action={{ label: t('home.apply'), href: '#/apply' }}
      >
        What happens, step by step, and what you can do at every point.
      </PageHead>
      <Section id="steps" eyebrow="The journey" title="Five steps.">
        <ol className="s-timeline reveal">
          {steps.map(([h, p], i) => (
            <li key={h}>
              <span>{i + 1}</span>
              <div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>
      <Section id="prepare" tone="soft" eyebrow="Before you ask" title="Helpful to have nearby.">
        <ul className="s-ticks">
          <li>Your phone number, switched on</li>
          <li>Any papers you were given: a summons, a letter, a contract</li>
          <li>Names and dates, even if you are not sure of them</li>
        </ul>
        <p className="s-sub">Do not worry if you have none of these. Just tell us what happened.</p>
      </Section>
      <CtaBand />
    </>
  );
}

function Membership() {
  const { t } = useI18n();
  return (
    <>
      <PageHead
        eyebrow="Membership"
        title="Be ready before you need us."
        photo={{ name: 'family', alt: 'A father and his children at the table in the evening.' }}
        facts={[
          ['Premium', 'Paid monthly, or ahead'],
          ['Family', 'Add your dependants'],
          ['Login', 'Policy number and a code'],
        ]}
        jump={[
          ['cover-how', 'How it works'],
          ['rules', 'The fine print'],
          ['mfaq', 'Questions'],
        ]}
        action={{ label: t('nav.login'), href: '#/member' }}
      >
        Legal cover is a monthly plan. You pay a little, and a lawyer is there when you need one.
      </PageHead>
      <Section id="cover-how" eyebrow="How it works" title="Simple on purpose.">
        <div className="s-cards s-three reveal">
          <article className="s-card">
            <h3>Pay monthly</h3>
            <p>Pay one month at a time, or ahead for up to twelve, with EcoCash or OneMoney.</p>
          </article>
          <article className="s-card">
            <h3>Claim when it matters</h3>
            <p>
              Make a claim from your portal. A lawyer reviews it and tells you plainly what happens
              next.
            </p>
          </article>
          <article className="s-card">
            <h3>Cover your family</h3>
            <p>Add dependants to your policy so the people you care about are covered too.</p>
          </article>
        </div>
      </Section>
      <Section
        id="rules"
        tone="soft"
        eyebrow="Good to know"
        title="The fine print, in plain words."
      >
        <ul className="s-ticks">
          <li>
            Each policy has a yearly limit. Your portal shows what you have used and what is left.
          </li>
          <li>Some kinds of problem have a waiting period. We show the date you can claim from.</li>
          <li>If you miss a payment you have a short grace period. Catch up to keep your cover.</li>
          <li>Legal cover is not the same as free legal aid. We can tell you which fits you.</li>
        </ul>
      </Section>
      <Section
        id="member-login"
        tone="dark"
        eyebrow="Already a member?"
        title="Manage it all online."
      >
        <p className="s-sub">See what needs attention, pay, claim and get help in one place.</p>
        <div className="s-actions">
          <a className="s-btn s-light" href="#/member">
            {t('nav.login')}
          </a>
        </div>
      </Section>
      <Section id="mfaq" eyebrow="Questions" title="About membership.">
        <Faq />
      </Section>
      <CtaBand title="Want to join? Talk to us." />
    </>
  );
}

function About() {
  return (
    <>
      <PageHead
        eyebrow="About Blufountain"
        title="Access to justice, managed with care."
        photo={{ name: 'court', alt: 'Four lawyers walk together up the steps of a courthouse.' }}
        facts={[
          ['What we do', 'Legal aid and legal cover'],
          ['For whom', 'People who cannot pay a lawyer'],
          ['How', 'Real lawyers, plain words'],
        ]}
        jump={[
          ['mission', 'What we believe'],
          ['work', 'How we work'],
        ]}
      >
        We believe getting a lawyer should not depend on how much money you have this month.
      </PageHead>
      <Section id="mission" eyebrow="What we believe" title="Three things guide us.">
        <div className="s-cards s-three reveal">
          <article className="s-card">
            <h3>Justice is for everyone</h3>
            <p>Rights mean little if you cannot afford to use them. We work to close that gap.</p>
          </article>
          <article className="s-card">
            <h3>Say it simply</h3>
            <p>Law is hard enough. We write and speak so anyone can follow what is happening.</p>
          </article>
          <article className="s-card">
            <h3>Earn trust every day</h3>
            <p>We keep your information private, show your costs, and tell you the truth.</p>
          </article>
        </div>
      </Section>
      <Section id="work" tone="soft" eyebrow="How we work" title="People first, technology second.">
        <p className="s-sub">
          Our team handles reception, case work and billing in one system, so you never repeat your
          story. This website and the member portal make that help easier to reach. They never
          replace the people who help you.
        </p>
      </Section>
      <CtaBand />
    </>
  );
}

function Contact() {
  const { t } = useI18n();
  return (
    <>
      <PageHead
        eyebrow={t('nav.contact')}
        title="Talk to a person."
        photo={{ name: 'helpdesk', alt: 'A member of our team on a call, taking notes.' }}
        facts={[
          ['Phone', OFFICE_PHONE],
          ['Hours', 'Monday to Friday'],
          ['Call-back', 'Within one working day'],
        ]}
        jump={[
          ['reach', 'Ways to reach us'],
          ['cfaq', 'Questions'],
        ]}
      >
        Call us, or ask for a call and we will phone you.
      </PageHead>
      <Section id="reach" eyebrow="Ways to reach us" title="Choose what is easiest.">
        <div className="s-cards s-three reveal">
          <article className="s-card">
            <h3>Call us</h3>
            <p>Speak to our office on weekdays.</p>
            <a href={`tel:${OFFICE_PHONE.replace(/\s/g, '')}`}>{OFFICE_PHONE}</a>
          </article>
          <article className="s-card">
            <h3>Ask for a call</h3>
            <p>Tell us what happened and we call you within one working day.</p>
            <a href="#/apply">{t('home.apply')} ›</a>
          </article>
          <article className="s-card">
            <h3>Members</h3>
            <p>Log in to pay, claim or check your cover.</p>
            <a href="#/member">{t('nav.login')} ›</a>
          </article>
        </div>
      </Section>
      <Section id="cfaq" tone="soft" eyebrow="Questions" title="Common questions.">
        <Faq />
      </Section>
    </>
  );
}

export default function Pages({ view }: { view: Exclude<SiteView, 'home'> }) {
  switch (view) {
    case 'services':
      return <Services />;
    case 'serve':
      return <Serve />;
    case 'how':
      return <How />;
    case 'membership':
      return <Membership />;
    case 'about':
      return <About />;
    case 'contact':
      return <Contact />;
  }
}
