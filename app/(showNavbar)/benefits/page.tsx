import BenefitsPage from '@/components/Benefits'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Benefits | Enugu Market',
  description:
    'What the Enugu State food scheme delivers for civil servants, local producers and the state.',
}

const page = () => {
  return (
    <div>
      <BenefitsPage />
      <Footer />
    </div>
  )
}

export default page
