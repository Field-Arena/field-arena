import type { ReactElement } from 'react';
import { ArticleShell } from '@/modules/marketing/ui/article-shell';
import { GuideBreadcrumb } from '@/modules/marketing/content/guides/guide-breadcrumb';
import { DemoLink } from '@/modules/marketing/content/guides/demo-link';
import { CtaBand } from '@/modules/marketing/content/guides/cta-band';

export function HorseShowScoringSoftware(): ReactElement {
  return (
    <ArticleShell
      eyebrow="Scoring"
      title="Horse Show Scoring Software: Simplify Competition Results With Modern Equestrian Technology"
      subhead="Accurate, efficient scoring software built for horse shows."
      lede="Scoring is one of the most important parts of any equestrian competition. Riders, trainers, owners, judges, and spectators all depend on accurate results being delivered quickly and professionally."
      breadcrumb={<GuideBreadcrumb label="Horse Show Scoring Software" />}
      ctaRow={<DemoLink>Book a demo</DemoLink>}
    >
      <article>
        <p>
          Traditional scoring methods often rely on paper score sheets, manual calculations,
          spreadsheets, and time-consuming result entry. These processes create opportunities for
          mistakes, delays, and unnecessary pressure on the show office.
        </p>
        <p>
          <strong>
            Field-Arena is horse show scoring software designed to help competition organizers
            collect, manage, calculate, and publish results efficiently
          </strong>{' '}
          — giving your team more confidence and your competitors a better experience.
        </p>

        <hr />
        <h2>What Is Horse Show Scoring Software?</h2>
        <p>
          Horse show scoring software is a digital system that helps competition organizers manage
          scores, rankings, and results throughout an equestrian event. Instead of manually tracking
          results across multiple documents, organizers can use one centralized platform to manage:
        </p>
        <ul>
          <li>Competitor scores</li>
          <li>Horse and rider information</li>
          <li>Class results</li>
          <li>Placings</li>
          <li>Rankings</li>
          <li>Judge submissions</li>
          <li>Awards information</li>
          <li>Published results</li>
        </ul>
        <p>A modern scoring system reduces manual work while improving accuracy and transparency.</p>

        <hr />
        <h2>Why Horse Shows Need Digital Scoring Software</h2>
        <p>
          A horse show can have hundreds of competitors, multiple divisions, and thousands of
          individual scores to manage. A scoring error can impact rider standings, championship
          qualifications, awards, final results, and competitor trust.
        </p>
        <p>Field-Arena helps show managers:</p>
        <h3>Reduce Scoring Errors</h3>
        <p>Automate calculations and reduce mistakes caused by manual data entry.</p>
        <h3>Save Show Office Time</h3>
        <p>Spend less time entering, checking, and correcting results.</p>
        <h3>Publish Results Faster</h3>
        <p>Provide competitors with timely and accurate results.</p>
        <h3>Create a More Professional Experience</h3>
        <p>Deliver the level of organization expected at modern equestrian events.</p>

        <hr />
        <h2>How Horse Show Scoring Software Works</h2>
        <h3>1. Create Your Competition Classes</h3>
        <p>
          Before scoring begins, organizers build the structure of their event — divisions, classes,
          tests, competition levels, and entry information.
        </p>
        <h3>2. Capture Judge Scores Efficiently</h3>
        <p>
          Digital scoring workflows reduce paperwork, improve score organization, minimize
          transcription errors, and keep results moving efficiently.
        </p>
        <h3>3. Calculate Results Automatically</h3>
        <p>
          Manual calculations can become complicated across multiple classes, divisions,
          tie-breaking procedures, percentages, points, and placings. Horse show scoring software
          helps automate calculations so results are consistent and accurate.
        </p>
        <h3>4. Manage Final Results</h3>
        <p>
          Once scoring is complete, organizers can easily manage final standings, class winners,
          award information, and published results.
        </p>

        <hr />
        <h2>Horse Show Scoring Software for Multiple Disciplines</h2>
        <h3>Dressage Scoring Software</h3>
        <p>
          Manage dressage tests, scores, percentages, and final results — useful for schooling
          shows, recognized competitions, dressage championships, and combined training events.
        </p>
        <h3>Hunter/Jumper Scoring Software</h3>
        <p>
          Manage competition results for hunter classes, jumper classes, equitation divisions, and
          medal classes.
        </p>
        <h3>Eventing and Combined Training Scoring Software</h3>
        <p>Coordinate results across dressage, cross country, and stadium jumping.</p>

        <hr />
        <h2>Horse Show Scoring Software vs. Manual Score Sheets</h2>
        <table className="compare">
          <thead>
            <tr>
              <th>Manual Scoring</th>
              <th>Digital Scoring Software</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Paper score sheets</td>
              <td>Centralized digital records</td>
            </tr>
            <tr>
              <td>Manual calculations</td>
              <td>Automated calculations</td>
            </tr>
            <tr>
              <td>Slower results</td>
              <td>Faster publishing</td>
            </tr>
            <tr>
              <td>Higher chance of errors</td>
              <td>Improved accuracy</td>
            </tr>
            <tr>
              <td>Difficult collaboration</td>
              <td>Team access</td>
            </tr>
          </tbody>
        </table>
        <p>As competitions grow, digital scoring becomes increasingly valuable.</p>

        <hr />
        <h2>Benefits for Horse Show Secretaries</h2>
        <p>
          Scoring software helps secretaries organize class results, reduce duplicate data entry,
          keep accurate records, communicate results efficiently, and reduce end-of-day paperwork.
          Instead of spending hours reconciling results, secretaries can focus on running a smooth
          competition.
        </p>

        <h2>Benefits for Judges and Officials</h2>
        <p>
          A well-designed scoring system supports officials by creating clear workflows, organized
          information, fewer administrative distractions, and more reliable results management. The
          goal is not to replace expertise — it is to support the people responsible for delivering
          fair competition.
        </p>

        <h2>Benefits for Competitors and Spectators</h2>
        <p>
          {`Today's competitors expect faster access to information. Digital scoring improves the experience with timely results, easier access to standings, better communication, and greater confidence in competition outcomes.`}
        </p>

        <hr />
        <h2>How Field-Arena Improves Horse Show Scoring</h2>
        <p>
          Field-Arena was designed specifically around the needs of equestrian competitions. Unlike
          generic event software, Field-Arena understands horse and rider combinations, competition
          classes, discipline-specific workflows, show office requirements, and the complexity of
          equestrian scoring.
        </p>
        <p>
          Field-Arena connects scoring with the rest of your horse show operations — including
          registration, scheduling, and results management.
        </p>

        <div className="callout">
          Organizers are looking for better ways to reduce administrative workload, improve accuracy,
          create better competitor experiences, and run more efficient events. Horse show scoring
          software provides the technology foundation for modern competitions.
        </div>
      </article>

      <CtaBand
        heading="Ready to upgrade your horse show scoring process?"
        body="Stop relying on disconnected spreadsheets and manual processes. See how Field-Arena can modernize your horse show scoring workflow."
        cta="Schedule a demo"
      />
    </ArticleShell>
  );
}
