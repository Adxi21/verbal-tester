import { SignedIn, SignedOut } from "@clerk/clerk-react";
import LandingPage from "./components/landing_page";
import Homepage from "./components/homepage";

export default function App() {
  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>

      <SignedIn>
        <Homepage />
      </SignedIn>
    </>
  );
}
