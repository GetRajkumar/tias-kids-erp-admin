export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'teacher' | 'parent';
  isActive: boolean;
  profileImage?: string;
  createdAt: string;
}

export interface MedicalInfo {
  allergies?: string[];
  medications?: string[];
  specialNeeds?: string;
  medicalConditions?: string[];
}

export interface EmergencyContact {
  name?: string;
  relation?: string;
  phone?: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface Student {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  bloodGroup?: string;
  parentId?: User;
  class?: string;
  section?: string;
  status: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  medicalInfo?: MedicalInfo;
  profileImage?: string;
  createdAt: string;
}

export interface AdmissionComment {
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  comment: string;
  commentedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  commentedAt: string;
}

export interface Admission {
  _id: string;
  childFirstName: string;
  childLastName: string;
  childDateOfBirth: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  preferredClass?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  studentId?: string;
  comments?: AdmissionComment[];
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  _id: string;
  studentId: Student;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedBy?: User;
  createdAt: string;
}

export interface Payment {
  _id: string;
  studentId: Student;
  parentId: User;
  amount: number;
  type: 'admission_fee' | 'tuition_fee' | 'transport_fee' | 'activity_fee' | 'other';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  ticketNumber: string;
  subject: string;
  createdBy: User;
  category: 'general' | 'academic' | 'transport' | 'payment' | 'health' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  pendingAdmissions: number;
  todayAttendance: { total: number; present: number; absent: number; late: number };
  monthlyRevenue: number;
  pendingPayments: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: string;
  targetAudience: string;
  targetClass?: string;
  isActive: boolean;
  publishDate: string;
  expiryDate?: string;
  createdBy: { firstName: string; lastName: string };
  createdAt: string;
}

export interface HomeworkSubmission {
  studentId: Student | string;
  submittedAt: string;
  content: string;
  attachments: string[];
  grade?: string;
  feedback?: string;
  gradedBy?: User | string;
  gradedAt?: string;
}

export interface Homework {
  _id: string;
  title: string;
  description: string;
  subject: string;
  targetClass: string;
  dueDate: string;
  attachments: string[];
  createdBy: User | string;
  submissions: HomeworkSubmission[];
  isActive: boolean;
  createdAt: string;
}
