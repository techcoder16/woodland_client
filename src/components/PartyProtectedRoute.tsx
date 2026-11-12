import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getPartyAccessToken, partyRefresh, PartyKind } from "@/helper/partyAuth";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";

const KIND_LOGIN: Record<PartyKind, string> = {
  vendor: "/landlord/login",
  tenant: "/tenant/login",
  contractor: "/contractor/login",
};

// Minimal guard for the Vendor/Tenant/Contractor portals — checks for that
// party's own cookie namespace, entirely separate from the staff
// ProtectedRoute/AuthContext so a staff session in the same browser is
// unaffected either way.
const PartyProtectedRoute = ({ kind, children }: { kind: PartyKind; children: React.ReactNode }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    (async () => {
      let ok = !!(await getPartyAccessToken(kind));
      // Access cookie gone but the refresh token is still there: renew quietly
      // instead of sending the user back to the login page.
      if (!ok && (await DEFAULT_COOKIE_GETTER(`${kind}_refresh_token`))) ok = await partyRefresh(kind);
      setHasToken(ok);
      setIsChecking(false);
    })();
  }, [kind]);

  if (isChecking) return null;
  if (!hasToken) return <Navigate to={KIND_LOGIN[kind]} replace />;
  return <>{children}</>;
};

export default PartyProtectedRoute;
