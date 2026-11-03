import { LOGO } from '../lib/brand';

/** The white strip on top of every client screen: Lee's monogram and name. */
export function BrandBar({ end }: { end?: React.ReactNode }) {
  return (
    <header className="brand-bar">
      <div className="brand" aria-label="Nails by Lee">
        <img src={LOGO} alt="" />
        <span>
          <small>nails by</small>
          <b>Lee</b>
        </span>
      </div>
      {end}
    </header>
  );
}
