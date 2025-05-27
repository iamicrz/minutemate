export type UserRole = "seeker" | "provider" | "admin" | null
export type VerificationStatus = "pending" | "approved" | "rejected"
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled"
export type SessionStatus = "scheduled" | "in_progress" | "completed" | "cancelled"

export interface User {
  id: string
  clerk_id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  balance: number
  created_at: string
  updated_at: string
}

export interface ProfessionalProfile {
  id: string
  user_id: string
  title: string
  bio?: string
  credentials?: string
  experience?: string
  category: string
  rate_per_15min: number
  is_verified: boolean
  verification_status: VerificationStatus
  average_rating: number
  total_reviews: number
  total_sessions: number
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  seeker_id: string
  professional_id: string
  scheduled_date: string
  start_time: string
  duration_minutes: number
  total_amount: number
  status: BookingStatus
  meeting_url?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface AvailabilitySlot {
  id: string
  professional_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
}

export interface Review {
  id: string
  session_id: string
  seeker_id: string
  professional_id: string
  rating: number
  comment?: string
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  booking_id?: string
  type: string
  amount: number
  description?: string
  stripe_payment_intent_id?: string
  status: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string
          name: string
          role: "seeker" | "provider" | "admin" | null
          balance: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          email: string
          name: string
          role?: "seeker" | "provider" | "admin" | null
          balance?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_id?: string
          email?: string
          name?: string
          role?: "seeker" | "provider" | "admin" | null
          balance?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      professional_profiles: {
        Row: {
          id: string
          user_id: string
          title: string
          bio: string | null
          credentials: string | null
          experience: string | null
          category: string
          rate_per_15min: number
          is_verified: boolean
          average_rating: number
          total_reviews: number
          total_sessions: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          bio?: string | null
          credentials?: string | null
          experience?: string | null
          category: string
          rate_per_15min: number
          is_verified?: boolean
          average_rating?: number
          total_reviews?: number
          total_sessions?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          bio?: string | null
          credentials?: string | null
          experience?: string | null
          category?: string
          rate_per_15min?: number
          is_verified?: boolean
          average_rating?: number
          total_reviews?: number
          total_sessions?: number
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          seeker_id: string
          professional_id: string
          scheduled_date: string
          start_time: string
          duration_minutes: number
          total_amount: number
          status: "pending" | "confirmed" | "completed" | "cancelled"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seeker_id: string
          professional_id: string
          scheduled_date: string
          start_time: string
          duration_minutes: number
          total_amount: number
          status?: "pending" | "confirmed" | "completed" | "cancelled"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seeker_id?: string
          professional_id?: string
          scheduled_date?: string
          start_time?: string
          duration_minutes?: number
          total_amount?: number
          status?: "pending" | "confirmed" | "completed" | "cancelled"
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          booking_id: string
          seeker_id: string
          professional_id: string
          started_at: string | null
          ended_at: string | null
          status: "scheduled" | "in_progress" | "completed" | "cancelled"
          actual_duration_minutes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          seeker_id: string
          professional_id: string
          started_at?: string | null
          ended_at?: string | null
          status?: "scheduled" | "in_progress" | "completed" | "cancelled"
          actual_duration_minutes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          seeker_id?: string
          professional_id?: string
          started_at?: string | null
          ended_at?: string | null
          status?: "scheduled" | "in_progress" | "completed" | "cancelled"
          actual_duration_minutes?: number | null
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          session_id: string
          seeker_id: string
          professional_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          seeker_id: string
          professional_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          seeker_id?: string
          professional_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          booking_id: string | null
          type: "payment" | "payout" | "add_funds" | "refund"
          amount: number
          description: string | null
          status: "pending" | "completed" | "failed"
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          booking_id?: string | null
          type: "payment" | "payout" | "add_funds" | "refund"
          amount: number
          description?: string | null
          status?: "pending" | "completed" | "failed"
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          booking_id?: string | null
          type?: "payment" | "payout" | "add_funds" | "refund"
          amount?: number
          description?: string | null
          status?: "pending" | "completed" | "failed"
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: "booking" | "payment" | "system" | "review"
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: "booking" | "payment" | "system" | "review"
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: "booking" | "payment" | "system" | "review"
          is_read?: boolean
          created_at?: string
        }
      }
      verification_requests: {
        Row: {
          id: string
          user_id: string
          professional_title: string
          credentials: string
          experience_years: number
          portfolio_url: string | null
          linkedin_url: string | null
          additional_info: string | null
          status: "pending" | "approved" | "rejected"
          admin_notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          professional_title: string
          credentials: string
          experience_years: number
          portfolio_url?: string | null
          linkedin_url?: string | null
          additional_info?: string | null
          status?: "pending" | "approved" | "rejected"
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          professional_title?: string
          credentials?: string
          experience_years?: number
          portfolio_url?: string | null
          linkedin_url?: string | null
          additional_info?: string | null
          status?: "pending" | "approved" | "rejected"
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
