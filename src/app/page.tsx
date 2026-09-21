import Hero from '@/components/sections/01-Hero';
import Solutions from '@/components/sections/02-Solutions';
import Method from '@/components/sections/03-Method';
import CaseStudies from '@/components/sections/04-CaseStudies';
import Services from '@/components/sections/05-Services';
import Capabilities from '@/components/sections/06-Capabilities';
import Agency from '@/components/sections/07-Agency';
import Resources from '@/components/sections/08-Resources';
import Contact from '@/components/sections/09-Contact';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Solutions />
      <Method />
      <CaseStudies />
      <Services />
      <Capabilities />
      <Agency />
      <Resources />
      <Contact />
    </>
  );
}
