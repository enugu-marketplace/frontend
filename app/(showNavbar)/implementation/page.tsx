import ImplementationRoadmap from '@/components/Implementation'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Implementation roadmap | Enugu Market',
  description:
    'The phased rollout of the Enugu State food scheme: pilot, expansion, full-scale implementation, and how risk is managed.',
}

const page = () => {
  return (
    <div>
      <ImplementationRoadmap />
      <Footer />
    </div>
  )
}

export default page
