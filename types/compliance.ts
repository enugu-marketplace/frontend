
export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  level: string;
  employee_id: string;
  government_entity: string;
  salary_per_month: number;
  loan_unit: number;
  loan_amount_collected: number;
  loan_extension?: number;
  max_extension_limit?: number;
  is_address_set: boolean;
  role: string;
  profile_image: string | null;
  is_compliance_submitted: boolean;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface Consent {
  id: string;
  userId: string;
  form_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface ComplianceResponse {
  message: string;
  data: Consent[];
}

export interface SingleComplianceResponse {
  message: string;
  data: Consent;
}

export interface UpdateComplianceStatus {
  status: 'APPROVED' | 'REJECTED';
}