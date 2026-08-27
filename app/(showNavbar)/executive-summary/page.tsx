import ExecutiveSummary from '@/components/executive-summary'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Executive summary | Enugu Market',
  description:
    'The Enugu State food loan scheme in brief: state financing, payroll-linked repayment at 0% interest, and local sourcing.',
}

const page = () => {
  return (
    <div>
      <ExecutiveSummary />
      <Footer />
    </div>
  )
}

export default page
