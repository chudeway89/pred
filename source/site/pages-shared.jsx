// Shared primitives used across both directions.
// Hash-based router, navigation hook, page registry.

const { useEffect: useEffectS, useState: useStateS } = React;

function useHashRoute(defaultRoute = "/") {
  const [route, setRoute] = useStateS(() => {
    if (typeof window === "undefined") return defaultRoute;
    const h = window.location.hash.replace(/^#/, "");
    return h || defaultRoute;
  });
  useEffectS(() => {
    const onHash = () => setRoute(window.location.hash.replace(/^#/, "") || defaultRoute);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [defaultRoute]);
  return [route, (r) => { window.location.hash = r; }];
}

// In artboard mode, we don't want to mutate the parent window's hash. So we
// fall back to local state if `local` flag is true.
function useLocalRoute(defaultRoute = "/") {
  const [route, setRoute] = useStateS(defaultRoute);
  return [route, setRoute];
}

// Site map — used by both directions
const NAV = [
  { id: "/", label: "Home" },
  { id: "/services", label: "Services" },
  { id: "/diagnostic", label: "Diagnostic" },
  { id: "/about", label: "About" },
  { id: "/contact", label: "Contact" },
];

const SUBNAV = SUBBRANDS.map(s => ({ id: `/${s.id}`, label: s.short }));

window.useHashRoute = useHashRoute;
window.useLocalRoute = useLocalRoute;
window.NAV = NAV;
window.SUBNAV = SUBNAV;
