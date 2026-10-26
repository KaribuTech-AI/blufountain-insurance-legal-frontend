import { useI18n } from '@blufountain/i18n/react';
import { Icon, MATTERS } from '@blufountain/public-kit';
import { CtaBand, Faq, Photo, Section } from './parts';

export function Home() {
  const { t } = useI18n();
  return (
    <>
      <section className="s-hero">
        <div className="s-wrap s-hero-in">
          <div className="s-hero-copy">
            <p className="s-eyebrow">{t('land.eyebrow')}</p>
            <h1>
              A lawyer in your corner. <span>Whatever life brings.</span>
            </h1>
            <p className="s-lede">
              Blufountain gives families and workers in Zimbabwe real legal help: free legal aid if
              you cannot pay, and low monthly cover if you want to be ready.
            </p>
            <div className="s-actions">
              <a className="s-btn s-light" href="#/apply">
                {t('home.apply')}
              </a>
              <a className="s-btn s-outline" href="#/membership">
                Explore membership
              </a>
            </div>
            <ul className="s-hero-proof">
              <li>
                <b>1 day</b>
                <span>to hear back</span>
              </li>
              <li>
                <b>6</b>
                <span>kinds of problem</span>
              </li>
              <li>
                <b>3</b>
                <span>languages</span>
              </li>
            </ul>
            <p className="s-hero-member">
              {t('land.login.hint')} <a href="#/member">{t('nav.login')} ›</a>
            </p>
          </div>
          <div className="s-hero-art">
            <Photo
              name="hero"
              priority
              className="s-hero-photo"
              sizes="(min-width: 980px) 480px, 90vw"
              alt="A mother and her daughter sit on their doorstep, reading a message on her phone."
            />
            <div className="s-float s-float-a" aria-hidden="true">
              <i />
              <span>
                <b>We will call you</b>
                Within one working day
              </span>
            </div>
            <div className="s-float s-float-b" aria-hidden="true">
              <i />
              <span>
                <b>Payment received</b>
                EcoCash · 2 months
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="s-strip">
        <div className="s-wrap">
          <span>English, Shona and isiNdebele</span>
          <span>Pay with EcoCash or OneMoney</span>
          <span>A person calls you within one working day</span>
        </div>
      </div>

      <section className="s-story" aria-labelledby="story-h">
        <div className="s-wrap s-story-in">
          <Photo
            name="lawyer"
            className="s-story-photo"
            alt="A lawyer listens closely as an older man explains his problem across her desk."
          />
          <div>
            <p className="s-eyebrow">Why we exist</p>
            <h2 id="story-h" className="s-h2">
              Nobody should face the law alone.
            </h2>
            <p className="s-sub">
              A dismissal letter. An eviction notice. A charge you do not understand. These are the
              moments that decide a family's future, and they are the moments when people can least
              afford a lawyer. We make sure someone is on your side.
            </p>
          </div>
        </div>
      </section>

      <Section id="what" eyebrow="What we do" title="Two ways to get a lawyer.">
        <div className="s-cards s-three reveal">
          <article className="s-card">
            <Icon name="help" className="s-ico" />
            <h3>Free legal aid</h3>
            <p>
              Tell us what happened. If you cannot pay for a lawyer, we look at your case and match
              you with one, at no cost to you.
            </p>
            <a href="#/apply">Ask for legal help ›</a>
          </article>
          <article className="s-card">
            <Icon name="shield" className="s-ico" />
            <h3>Legal cover</h3>
            <p>
              Pay a small amount each month and know a lawyer is there when you need one, for you
              and your family, up to a yearly limit.
            </p>
            <a href="#/membership">See how cover works ›</a>
          </article>
          <article className="s-card">
            <Icon name="search" className="s-ico" />
            <h3>Follow your case</h3>
            <p>
              See the stage of your case, your next court date and your lawyer's name, any time,
              with a code sent to your phone.
            </p>
            <a href="#/check">{t('home.check')} ›</a>
          </article>
        </div>
      </Section>

      <Section
        id="serve"
        tone="soft"
        eyebrow="Who we serve"
        title="Built for the problems that change a life."
      >
        <p className="s-sub">
          Most people meet a lawyer for the first time on the worst day. We help with the six things
          that hurt families most.
        </p>
        <div className="s-mosaic reveal">
          <figure>
            <Photo
              name="worker"
              sizes="(min-width: 900px) 33vw, 100vw"
              alt="A worker in overalls stands outside a workshop."
            />
            <figcaption>{t('matter.labour')}</figcaption>
          </figure>
          <figure>
            <Photo
              name="grandmother"
              sizes="(min-width: 900px) 33vw, 100vw"
              alt="An elderly woman stands in front of her rural home, holding her papers."
            />
            <figcaption>{t('matter.land_eviction')}</figcaption>
          </figure>
          <figure>
            <Photo
              name="family"
              sizes="(min-width: 900px) 33vw, 100vw"
              alt="A father checks his phone at the table while his children do homework."
            />
            <figcaption>{t('matter.family_maintenance')}</figcaption>
          </figure>
        </div>
        <ul className="s-tiles reveal">
          {MATTERS.map((m) => (
            <li key={m}>{t(`matter.${m}`)}</li>
          ))}
        </ul>
        <a className="s-link" href="#/serve">
          See who we help ›
        </a>
      </Section>

      <Section id="how" eyebrow={t('home.how')} title="Three steps. No forms to fear.">
        <ol className="s-steps reveal">
          <li>
            <span>1</span>
            <h3>{t('home.step1')}</h3>
            <p>
              Use your phone. Write in English, Shona or isiNdebele. It takes about five minutes.
            </p>
          </li>
          <li>
            <span>2</span>
            <h3>{t('home.step2')}</h3>
            <p>A member of our team listens, explains your options and tells you what is next.</p>
          </li>
          <li>
            <span>3</span>
            <h3>{t('home.step3')}</h3>
            <p>If we can help, a lawyer takes your case and you can follow it online.</p>
          </li>
        </ol>
      </Section>

      <Section id="members" tone="dark" eyebrow="For members" title="Your cover, in your pocket.">
        <div className="s-split">
          <div>
            <p className="s-sub">
              Log in with your phone number and a code sent to it. No password to forget.
            </p>
            <ul className="s-ticks">
              <li>See what needs your attention first</li>
              <li>Pay your premium with EcoCash or OneMoney</li>
              <li>Make a claim and follow every step</li>
              <li>Check what you have used and what is left</li>
            </ul>
            <div className="s-actions">
              <a className="s-btn s-light" href="#/member">
                {t('nav.login')}
              </a>
              <a className="s-link" href="#/membership">
                Learn about membership ›
              </a>
            </div>
          </div>
          <div className="s-members-art">
            <Photo
              name="family"
              className="s-members-photo"
              alt="A family at home in the evening, the father holding his phone."
            />
            <PortalPreview compact />
          </div>
        </div>
      </Section>

      <Section id="trust" eyebrow="Our promise" title="Clear, private and fair.">
        <div className="s-cards s-three reveal">
          <article className="s-card">
            <h3>Plain words</h3>
            <p>
              No jargon. Everything is written to be understood on a small screen, in your language.
            </p>
          </article>
          <article className="s-card">
            <h3>Your privacy</h3>
            <p>One-time codes and short sessions. Your case is shown only to you.</p>
          </article>
          <article className="s-card">
            <h3>Honest about money</h3>
            <p>
              You see what you will pay before you pay. A payment counts when your provider confirms
              it.
            </p>
          </article>
        </div>
      </Section>

      <Section id="faq" tone="soft" eyebrow="Questions" title="Good questions, straight answers.">
        <Faq />
      </Section>

      <CtaBand />
    </>
  );
}

/** A drawn example of the member portal. It is not real data. */
function PortalPreview({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? 's-preview s-compact' : 's-preview'} aria-hidden="true">
      <div className="s-preview-bar">
        <i />
        <i />
        <i />
        <span>Example</span>
      </div>
      <div className="s-preview-body">
        <p className="s-preview-h">Needs your attention</p>
        <div className="s-preview-row warn">
          <b>Pay your premium</b>
          <span>$5 to catch up</span>
        </div>
        <div className="s-preview-row">
          <b>Claim CL-2026-0002</b>
          <span>A lawyer is helping you</span>
        </div>
        <p className="s-preview-h">Your cover</p>
        <div className="s-preview-meter">
          <div />
        </div>
        <div className="s-preview-foot">
          <span>$45 used</span>
          <span>$1,455 left</span>
        </div>
      </div>
    </div>
  );
}
