import { logout } from "@/lib/actions/auth";
import { AccountPanel, AccountSubpage, AsIcon } from "../account-subpage";

// SETTINGS (My Profile). Only real account controls today: the signed-in
// email and Log out via the existing logout() action. Profile visibility
// and emergency contact have no storage yet, so they are not shown.
export function SettingsView({ email }: { email: string }) {
  return (
    <AccountSubpage id="barber-settings-page" t1="SETTINGS" sub="YOUR POLAR ACCOUNT">
      <AccountPanel icon="user" title="ACCOUNT">
        <div className="as-row">
          <span className="as-label">Signed in as</span>
          <span className="as-value">
            <AsIcon name="envelope" />
            {email || "—"}
          </span>
        </div>
      </AccountPanel>

      <AccountPanel icon="logout" title="LOG OUT">
        <p className="as-desc">Sign out of POLAR on this device.</p>
        <form action={logout} style={{ marginTop: "calc(var(--u) * 18)" }}>
          <button type="submit" className="as-btn">
            <AsIcon name="logout" />
            LOG OUT
          </button>
        </form>
      </AccountPanel>
    </AccountSubpage>
  );
}
