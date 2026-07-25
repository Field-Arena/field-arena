import { WORKFLOW_STEPS } from '../constants';

export function WorkflowSection() {
  return (
    <section id="workflow">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Workflow</span>
          <h2>A cleaner workflow at every stage of the event.</h2>
        </div>

        <div className="steps">
          {WORKFLOW_STEPS.map((step) => (
            <article key={step.title} className="step">
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
