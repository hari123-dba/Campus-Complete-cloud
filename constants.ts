import { UserRole, CompetitionStatus, ProjectPhase } from './types';
import { Shield, School, UserCog, BookOpen, GraduationCap } from 'lucide-react';

export const ROLE_CONFIG = {
  [UserRole.ADMIN]: {
    color: 'bg-red-500',
    icon: Shield,
    description: 'System config & oversight',
    demoEmail: 'admin@campus.edu'
  },
  [UserRole.PRINCIPAL]: {
    color: 'bg-purple-600',
    icon: School,
    description: 'Institution-wide metrics',
    demoEmail: 'principal@campus.edu'
  },
  [UserRole.HOD]: {
    color: 'bg-blue-600',
    icon: UserCog,
    description: 'Department management',
    demoEmail: 'hod@campus.edu'
  },
  [UserRole.LECTURER]: {
    color: 'bg-green-600',
    icon: BookOpen,
    description: 'Evaluation & mentorship',
    demoEmail: 'lecturer@campus.edu'
  },
  [UserRole.STUDENT]: {
    color: 'bg-orange-500',
    icon: GraduationCap,
    description: 'Project submission & teams',
    demoEmail: 'student@campus.edu'
  }
};

export const STATUS_COLORS = {
  [CompetitionStatus.DRAFT]: 'bg-slate-400',
  [CompetitionStatus.UPCOMING]: 'bg-blue-400',
  [CompetitionStatus.ONGOING]: 'bg-green-500',
  [CompetitionStatus.EVALUATION]: 'bg-yellow-500',
  [CompetitionStatus.COMPLETED]: 'bg-purple-500'
};

export const PHASE_STEPS = [
  ProjectPhase.DESIGN,
  ProjectPhase.DEVELOPMENT,
  ProjectPhase.TESTING,
  ProjectPhase.IMPLEMENTATION
];

export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Business Administration',
  'Applied Sciences'
];

export const ACADEMIC_YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Final Year'
];