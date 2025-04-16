export type Event = {
  id: string // UUID format
  name: string
  description: string | null
  location: string | null
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export type Guest = {
  id: string // UUID format
  event_id: string // UUID format
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

export type User = {
  id: string // UUID format
  email: string
  first_name: string
  last_name: string
  username: string
  role: "super_admin" | "admin" | "staff"
  created_at: string
  updated_at: string
}

export type CheckIn = {
  id: string // UUID format
  guest_id: string // UUID format
  event_id: string // UUID format
  check_in_time: string
  check_in_by: string | null
  location: string | null
  notes: string | null
}
