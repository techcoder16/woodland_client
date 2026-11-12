import logo from "@/assets/logo.png";

/** Full-screen logo shown while the app, a route chunk or the session loads. */
export default function SplashScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <img src={logo} alt="Woodland" className="w-56 max-w-[60vw] h-auto animate-pulse" />
    </div>
  );
}
