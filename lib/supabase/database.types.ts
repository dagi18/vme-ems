export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          name: string
          description: string | null
          location: string | null
          start_date: string
          end_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          location?: string | null
          start_date: string
          end_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          location?: string | null
          start_date?: string
          end_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      guests: {
        Row: {
          id: string
          event_id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          company: string | null
          job_title: string | null
          registration_type: "self" | "on-site"
          registered_by: string | null
          badge_printed: boolean
          badge_id: string | null
          check_in_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          company?: string | null
          job_title?: string | null
          registration_type: "self" | "on-site"
          registered_by?: string | null
          badge_printed?: boolean
          badge_id?: string | null
          check_in_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          company?: string | null
          job_title?: string | null
          registration_type?: "self" | "on-site"
          registered_by?: string | null
          badge_printed?: boolean
          badge_id?: string | null
          check_in_time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      check_ins: {
        Row: {
          id: string
          guest_id: string
          event_id: string
          check_in_time: string
          check_in_by: string | null
          location: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          guest_id: string
          event_id: string
          check_in_time?: string
          check_in_by?: string | null
          location?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          guest_id?: string
          event_id?: string
          check_in_time?: string
          check_in_by?: string | null
          location?: string | null
          notes?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          username: string
          role: "super_admin" | "admin" | "staff"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          username: string
          role?: "super_admin" | "admin" | "staff"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          username?: string
          role?: "super_admin" | "admin" | "staff"
          created_at?: string
          updated_at?: string
        }
      }
      badge_templates: {
        Row: {
          id: string
          name: string
          is_default: boolean
          template_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          is_default?: boolean
          template_data: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          is_default?: boolean
          template_data?: Json
          created_at?: string
          updated_at?: string
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
