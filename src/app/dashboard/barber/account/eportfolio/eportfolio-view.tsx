import { AccountPanel, AccountSubpage, AsIcon } from "../account-subpage";

// ePORTFOLIO (My Profile). No portfolio storage exists yet, so this is an
// honest empty state — no upload control, no placeholder work.
export function EportfolioView() {
  return (
    <AccountSubpage id="barber-eportfolio-page" t1="ePORTFOLIO" sub="YOUR WORK">
      <AccountPanel icon="image" title="YOUR WORK">
        <div className="as-empty">
          <AsIcon name="image" />
          <p className="as-empty-title">No work added yet</p>
          <p className="as-desc">Adding photos of your cuts isn&apos;t available yet. When it is, your ePortfolio will show here.</p>
        </div>
      </AccountPanel>
    </AccountSubpage>
  );
}
