import type { ReactNode } from 'react';

type Props = {
  tag: string;
  before: string;
  highlight: string;
  after?: string;
  sub?: string;
  action?: ReactNode;
};

export default function PageHero({ tag, before, highlight, after = '', sub, action }: Props) {
  return (
    <section className="hero">
      <div>
        <span className="tag">{tag}</span>
        <h1 className="hero__title">
          {before}<span className="hero__highlight">{highlight}</span>{after}
        </h1>
        {sub && <p className="hero__sub">{sub}</p>}
      </div>
      {action}
    </section>
  );
}
