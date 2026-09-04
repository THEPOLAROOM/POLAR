import { Anton, Geist } from "next/font/google";
import { Header } from "./header";
import { Carousel } from "./carousel";
import { PanelWelcome } from "./panels/panel-01-welcome";
import { PanelWhy } from "./panels/panel-02-why";
import { PanelCard } from "./panels/panel-03-card";
import { PanelWorkflow } from "./panels/panel-04-workflow";
import { PanelHow } from "./panels/panel-05-how";
import { PanelAbout } from "./panels/panel-06-about";
import { PanelReady } from "./panels/panel-07-ready";
import { LowerSection } from "./lower-section";
import { Footer } from "./footer";

// Fonts are loaded and scoped here only (via CSS variables on this
// subtree's wrapper), not in the root layout — dashboards keep their
// existing default typography untouched.
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

const SLIDES = [
  { id: "welcome", label: "Welcome to POLAR", content: <PanelWelcome /> },
  { id: "why", label: "Why POLAR?", content: <PanelWhy /> },
  { id: "card", label: "POLAR Card", content: <PanelCard /> },
  { id: "workflow", label: "Workflow Mode", content: <PanelWorkflow /> },
  { id: "how", label: "How POLAR Works", content: <PanelHow /> },
  { id: "about", label: "About POLAR", content: <PanelAbout /> },
  { id: "ready", label: "You're Ready", content: <PanelReady /> },
];

export function LandingPage() {
  return (
    <div
      className={`${anton.variable} ${geist.variable} min-h-screen overflow-x-hidden bg-ice-50 font-body text-navy`}
    >
      <Header />
      <Carousel slides={SLIDES} />
      <LowerSection />
      <Footer />
    </div>
  );
}
