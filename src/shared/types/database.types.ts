export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      add_ons: {
        Row: {
          enabled: boolean | null
          id: string
          name: string
          nights: number | null
          price: number | null
          qty: number | null
          shavings: number | null
          show_id: string
          stalls: number | null
          tack: number | null
        }
        Insert: {
          enabled?: boolean | null
          id?: string
          name: string
          nights?: number | null
          price?: number | null
          qty?: number | null
          shavings?: number | null
          show_id: string
          stalls?: number | null
          tack?: number | null
        }
        Update: {
          enabled?: boolean | null
          id?: string
          name?: string
          nights?: number | null
          price?: number | null
          qty?: number | null
          shavings?: number | null
          show_id?: string
          stalls?: number | null
          tack?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "add_ons_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          id: number
          occurred_at: string
          reason: string | null
          row_id: string
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          id?: number
          occurred_at?: string
          reason?: string | null
          row_id: string
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          id?: number
          occurred_at?: string
          reason?: string | null
          row_id?: string
          table_name?: string
        }
        Relationships: []
      }
      catalog_documents: {
        Row: {
          created_at: string
          folder: string
          id: string
          name: string
          path: string
          url: string | null
        }
        Insert: {
          created_at?: string
          folder?: string
          id?: string
          name: string
          path: string
          url?: string | null
        }
        Update: {
          created_at?: string
          folder?: string
          id?: string
          name?: string
          path?: string
          url?: string | null
        }
        Relationships: []
      }
      class_assignments: {
        Row: {
          class_id: string
          id: string
          judge_staff_id: string | null
          scribe_staff_id: string | null
        }
        Insert: {
          class_id: string
          id?: string
          judge_staff_id?: string | null
          scribe_staff_id?: string | null
        }
        Update: {
          class_id?: string
          id?: string
          judge_staff_id?: string | null
          scribe_staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: true
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_assignments_judge_staff_id_fkey"
            columns: ["judge_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_assignments_scribe_staff_id_fkey"
            columns: ["scribe_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      class_entries: {
        Row: {
          advanced_past: boolean | null
          class_id: string
          collective_total: number | null
          correction: string | null
          division: string
          draw: number | null
          final_pct: string | null
          finalized_at: string | null
          holding: boolean | null
          horse: string | null
          horse_id: string | null
          id: string
          judge_pct: Json | null
          num: string
          order_id: string | null
          reason: string | null
          ride_order: number
          ride_started_at: string | null
          rider: string | null
          rider_id: string | null
          status: string | null
          test_override: Json | null
        }
        Insert: {
          advanced_past?: boolean | null
          class_id: string
          collective_total?: number | null
          correction?: string | null
          division?: string
          draw?: number | null
          final_pct?: string | null
          finalized_at?: string | null
          holding?: boolean | null
          horse?: string | null
          horse_id?: string | null
          id?: string
          judge_pct?: Json | null
          num: string
          order_id?: string | null
          reason?: string | null
          ride_order: number
          ride_started_at?: string | null
          rider?: string | null
          rider_id?: string | null
          status?: string | null
          test_override?: Json | null
        }
        Update: {
          advanced_past?: boolean | null
          class_id?: string
          collective_total?: number | null
          correction?: string | null
          division?: string
          draw?: number | null
          final_pct?: string | null
          finalized_at?: string | null
          holding?: boolean | null
          horse?: string | null
          horse_id?: string | null
          id?: string
          judge_pct?: Json | null
          num?: string
          order_id?: string | null
          reason?: string | null
          ride_order?: number
          ride_started_at?: string | null
          rider?: string | null
          rider_id?: string | null
          status?: string | null
          test_override?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "class_entries_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_entries_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_entries_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      class_panel: {
        Row: {
          class_id: string
          id: string
          judge_staff_id: string | null
          position: string | null
          scribe_staff_id: string | null
          seat_id: string
        }
        Insert: {
          class_id: string
          id?: string
          judge_staff_id?: string | null
          position?: string | null
          scribe_staff_id?: string | null
          seat_id: string
        }
        Update: {
          class_id?: string
          id?: string
          judge_staff_id?: string | null
          position?: string | null
          scribe_staff_id?: string | null
          seat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_panel_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_panel_judge_staff_id_fkey"
            columns: ["judge_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_panel_scribe_staff_id_fkey"
            columns: ["scribe_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      class_tests: {
        Row: {
          class_id: string
          collectives: Json | null
          edition: string | null
          id: string
          movements: Json | null
          name: string
          sections: Json | null
        }
        Insert: {
          class_id: string
          collectives?: Json | null
          edition?: string | null
          id?: string
          movements?: Json | null
          name: string
          sections?: Json | null
        }
        Update: {
          class_id?: string
          collectives?: Json | null
          edition?: string | null
          id?: string
          movements?: Json | null
          name?: string
          sections?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "class_tests_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: true
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          arena: string | null
          award_scope: string
          catalog_id: string | null
          created_at: string
          date: string | null
          display_name: string | null
          division: string | null
          event: string | null
          fee: number | null
          governing_body: string | null
          group_name: string | null
          id: string
          judges_count: number | null
          label: string
          location: string | null
          min_per_ride: number | null
          price_edited: boolean | null
          qual_fee: number | null
          qual_types: Json | null
          qualifying: boolean | null
          results_published: boolean | null
          results_published_at: string | null
          ribbon_colors: Json | null
          ribbon_places: number | null
          run_order: number | null
          score_format: string | null
          scoring_open: boolean | null
          scoring_pos: number | null
          show_id: string
          sponsor: string | null
          test_options: Json | null
          time: string | null
          working_in_entry_id: string | null
        }
        Insert: {
          arena?: string | null
          award_scope?: string
          catalog_id?: string | null
          created_at?: string
          date?: string | null
          display_name?: string | null
          division?: string | null
          event?: string | null
          fee?: number | null
          governing_body?: string | null
          group_name?: string | null
          id?: string
          judges_count?: number | null
          label: string
          location?: string | null
          min_per_ride?: number | null
          price_edited?: boolean | null
          qual_fee?: number | null
          qual_types?: Json | null
          qualifying?: boolean | null
          results_published?: boolean | null
          results_published_at?: string | null
          ribbon_colors?: Json | null
          ribbon_places?: number | null
          run_order?: number | null
          score_format?: string | null
          scoring_open?: boolean | null
          scoring_pos?: number | null
          show_id: string
          sponsor?: string | null
          test_options?: Json | null
          time?: string | null
          working_in_entry_id?: string | null
        }
        Update: {
          arena?: string | null
          award_scope?: string
          catalog_id?: string | null
          created_at?: string
          date?: string | null
          display_name?: string | null
          division?: string | null
          event?: string | null
          fee?: number | null
          governing_body?: string | null
          group_name?: string | null
          id?: string
          judges_count?: number | null
          label?: string
          location?: string | null
          min_per_ride?: number | null
          price_edited?: boolean | null
          qual_fee?: number | null
          qual_types?: Json | null
          qualifying?: boolean | null
          results_published?: boolean | null
          results_published_at?: string | null
          ribbon_colors?: Json | null
          ribbon_places?: number | null
          run_order?: number | null
          score_format?: string | null
          scoring_open?: boolean | null
          scoring_pos?: number | null
          show_id?: string
          sponsor?: string | null
          test_options?: Json | null
          time?: string | null
          working_in_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_working_in_entry_id_fkey"
            columns: ["working_in_entry_id"]
            isOneToOne: false
            referencedRelation: "class_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          id: string
          name: string
          position: number | null
          show_id: string
          subitems: Json | null
        }
        Insert: {
          id?: string
          name: string
          position?: number | null
          show_id: string
          subitems?: Json | null
        }
        Update: {
          id?: string
          name?: string
          position?: number | null
          show_id?: string
          subitems?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "divisions_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          event_ids: Json | null
          id: string
          name: string
          path: string
          show_id: string
          url: string | null
        }
        Insert: {
          created_at?: string
          event_ids?: Json | null
          id?: string
          name: string
          path: string
          show_id: string
          url?: string | null
        }
        Update: {
          created_at?: string
          event_ids?: Json | null
          id?: string
          name?: string
          path?: string
          show_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      horses: {
        Row: {
          created_at: string
          document_uploads: Json | null
          id: string
          is_stallion: boolean | null
          name: string
          rider_id: string
          stable: string | null
          trainer: string | null
          trainer_phone: string | null
        }
        Insert: {
          created_at?: string
          document_uploads?: Json | null
          id?: string
          is_stallion?: boolean | null
          name: string
          rider_id: string
          stable?: string | null
          trainer?: string | null
          trainer_phone?: string | null
        }
        Update: {
          created_at?: string
          document_uploads?: Json | null
          id?: string
          is_stallion?: boolean | null
          name?: string
          rider_id?: string
          stable?: string | null
          trainer?: string | null
          trainer_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "horses_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      independent_sheets: {
        Row: {
          family: string | null
          id: string
          show_id: string
          title: string
        }
        Insert: {
          family?: string | null
          id?: string
          show_id: string
          title: string
        }
        Update: {
          family?: string | null
          id?: string
          show_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "independent_sheets_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          name: string | null
          org_id: string | null
          role: string
          show_id: string | null
          staff_assignment_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          name?: string | null
          org_id?: string | null
          role: string
          show_id?: string | null
          staff_assignment_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          name?: string | null
          org_id?: string | null
          role?: string
          show_id?: string | null
          staff_assignment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_accepted_user_id_fkey"
            columns: ["accepted_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_staff_assignment_id_fkey"
            columns: ["staff_assignment_id"]
            isOneToOne: false
            referencedRelation: "staff_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          avg_revenue_per_show: number | null
          calendly_event_uri: string | null
          contact_name: string | null
          cost_per_event: number | null
          created_at: string
          demo_at: string | null
          email: string | null
          id: string
          notes: string | null
          onboarding_at: string | null
          onboarding_checklist: Json | null
          onboarding_email_sent_at: string | null
          org_name: string
          phone: string | null
          shows_per_year: number | null
          status: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avg_revenue_per_show?: number | null
          calendly_event_uri?: string | null
          contact_name?: string | null
          cost_per_event?: number | null
          created_at?: string
          demo_at?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          onboarding_at?: string | null
          onboarding_checklist?: Json | null
          onboarding_email_sent_at?: string | null
          org_name: string
          phone?: string | null
          shows_per_year?: number | null
          status?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avg_revenue_per_show?: number | null
          calendly_event_uri?: string | null
          contact_name?: string | null
          cost_per_event?: number | null
          created_at?: string
          demo_at?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          onboarding_at?: string | null
          onboarding_checklist?: Json | null
          onboarding_email_sent_at?: string | null
          org_name?: string
          phone?: string | null
          shows_per_year?: number | null
          status?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      member_database: {
        Row: {
          created_at: string
          email: string | null
          extra_fields: Json | null
          first_name: string | null
          id: string
          last_name: string | null
          membership_expires: string | null
          membership_status: string | null
          name: string
          notes: string | null
          org_id: string
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          extra_fields?: Json | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          membership_expires?: string | null
          membership_status?: string | null
          name: string
          notes?: string | null
          org_id: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          extra_fields?: Json | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          membership_expires?: string | null
          membership_status?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_database_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      merch_sales: {
        Row: {
          created_at: string
          id: string
          items: Json
          show_id: string
          total: number
        }
        Insert: {
          created_at?: string
          id?: string
          items: Json
          show_id: string
          total: number
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          show_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "merch_sales_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          additional_charges: Json | null
          additional_charges_total: number | null
          amount_total: number
          arrival_date: string | null
          created_at: string
          departure_date: string | null
          fee_total: number | null
          id: string
          items: Json | null
          paid_at: string | null
          refunded_amount: number | null
          rider_id: string
          show_id: string
          status: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_payment_method_id: string | null
        }
        Insert: {
          additional_charges?: Json | null
          additional_charges_total?: number | null
          amount_total: number
          arrival_date?: string | null
          created_at?: string
          departure_date?: string | null
          fee_total?: number | null
          id?: string
          items?: Json | null
          paid_at?: string | null
          refunded_amount?: number | null
          rider_id: string
          show_id: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_method_id?: string | null
        }
        Update: {
          additional_charges?: Json | null
          additional_charges_total?: number | null
          amount_total?: number
          arrival_date?: string | null
          created_at?: string
          departure_date?: string | null
          fee_total?: number | null
          id?: string
          items?: Json | null
          paid_at?: string | null
          refunded_amount?: number | null
          rider_id?: string
          show_id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_method_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          avg_entry_value: number | null
          city: string | null
          country: string | null
          created_at: string
          currency: string | null
          deleted_at: string | null
          email: string | null
          fee_model: string
          holdback_percent: number | null
          id: string
          is_demo: boolean
          locale: string | null
          name: string
          payout_cadence: string | null
          phone: string | null
          region: string | null
          stripe_connect_account_id: string | null
          suspended: boolean
          timezone: string | null
          website: string | null
        }
        Insert: {
          avg_entry_value?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          email?: string | null
          fee_model?: string
          holdback_percent?: number | null
          id?: string
          is_demo?: boolean
          locale?: string | null
          name: string
          payout_cadence?: string | null
          phone?: string | null
          region?: string | null
          stripe_connect_account_id?: string | null
          suspended?: boolean
          timezone?: string | null
          website?: string | null
        }
        Update: {
          avg_entry_value?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          email?: string | null
          fee_model?: string
          holdback_percent?: number | null
          id?: string
          is_demo?: boolean
          locale?: string | null
          name?: string
          payout_cadence?: string | null
          phone?: string | null
          region?: string | null
          stripe_connect_account_id?: string | null
          suspended?: boolean
          timezone?: string | null
          website?: string | null
        }
        Relationships: []
      }
      qual_types: {
        Row: {
          enabled: boolean | null
          id: string
          name: string
          price: number | null
          show_id: string
        }
        Insert: {
          enabled?: boolean | null
          id?: string
          name: string
          price?: number | null
          show_id: string
        }
        Update: {
          enabled?: boolean | null
          id?: string
          name?: string
          price?: number | null
          show_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qual_types_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      riders: {
        Row: {
          category: string | null
          city: string | null
          created_at: string
          dob: string | null
          ec_first_name: string | null
          ec_last_name: string | null
          ec_phone: string | null
          ec_rel: string | null
          email: string
          fei: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          state: string | null
          street: string | null
          usef: string | null
          zip: string | null
        }
        Insert: {
          category?: string | null
          city?: string | null
          created_at?: string
          dob?: string | null
          ec_first_name?: string | null
          ec_last_name?: string | null
          ec_phone?: string | null
          ec_rel?: string | null
          email: string
          fei?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          usef?: string | null
          zip?: string | null
        }
        Update: {
          category?: string | null
          city?: string | null
          created_at?: string
          dob?: string | null
          ec_first_name?: string | null
          ec_last_name?: string | null
          ec_phone?: string | null
          ec_rel?: string | null
          email?: string
          fei?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          usef?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      role_assignments: {
        Row: {
          created_at: string
          id: string
          role: string
          scope: Json | null
          show_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          scope?: Json | null
          show_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          scope?: Json | null
          show_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_assignments_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          class_id: string
          collectives: Json | null
          entry_id: string
          error_at: Json | null
          errors: number | null
          final_remarks: string | null
          id: string
          movements: Json | null
          remarks: Json | null
          seat_id: string
          signed_at: string | null
          signed_by: string | null
          submitted: boolean | null
          updated_at: string
        }
        Insert: {
          class_id: string
          collectives?: Json | null
          entry_id: string
          error_at?: Json | null
          errors?: number | null
          final_remarks?: string | null
          id?: string
          movements?: Json | null
          remarks?: Json | null
          seat_id: string
          signed_at?: string | null
          signed_by?: string | null
          submitted?: boolean | null
          updated_at?: string
        }
        Update: {
          class_id?: string
          collectives?: Json | null
          entry_id?: string
          error_at?: Json | null
          errors?: number | null
          final_remarks?: string | null
          id?: string
          movements?: Json | null
          remarks?: Json | null
          seat_id?: string
          signed_at?: string | null
          signed_by?: string | null
          submitted?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "class_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_catalog: {
        Row: {
          created_at: string
          def: Json | null
          discipline: string | null
          family: string | null
          governing_body: string | null
          id: string
          level: string | null
          source: string | null
          source_file: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          def?: Json | null
          discipline?: string | null
          family?: string | null
          governing_body?: string | null
          id?: string
          level?: string | null
          source?: string | null
          source_file?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          def?: Json | null
          discipline?: string | null
          family?: string | null
          governing_body?: string | null
          id?: string
          level?: string | null
          source?: string | null
          source_file?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      shows: {
        Row: {
          created_at: string
          date_label: string | null
          day_end_times: Json | null
          day_start_times: Json | null
          disciplines: Json | null
          document_requirements: Json | null
          end_date: string | null
          expenses: Json | null
          governing_bodies: Json | null
          id: string
          locations: Json | null
          logo_path: string | null
          manual_horses: Json | null
          merch_items: Json | null
          merchandise_enabled: boolean | null
          name: string
          org_id: string
          published: boolean | null
          published_at: string | null
          runner_state: Json | null
          schedule_extras: Json | null
          schedule_prefs: Json | null
          selected_template: string | null
          show_details: Json | null
          show_image_path: string | null
          show_type: string | null
          stable_chart: Json | null
          start_date: string | null
          starting_rider_number: number | null
          status: string | null
          ticket_close: string | null
          ticket_open: string | null
          timezone: string | null
          vendor_agreement_text: string | null
          vendor_document_requirements: Json | null
          vendor_map_path: string | null
          vendor_map_url: string | null
          venue_id: string | null
          venue_name: string | null
          waiver_approved_at: string | null
          waiver_approved_text: string | null
          waiver_text: string | null
        }
        Insert: {
          created_at?: string
          date_label?: string | null
          day_end_times?: Json | null
          day_start_times?: Json | null
          disciplines?: Json | null
          document_requirements?: Json | null
          end_date?: string | null
          expenses?: Json | null
          governing_bodies?: Json | null
          id?: string
          locations?: Json | null
          logo_path?: string | null
          manual_horses?: Json | null
          merch_items?: Json | null
          merchandise_enabled?: boolean | null
          name: string
          org_id: string
          published?: boolean | null
          published_at?: string | null
          runner_state?: Json | null
          schedule_extras?: Json | null
          schedule_prefs?: Json | null
          selected_template?: string | null
          show_details?: Json | null
          show_image_path?: string | null
          show_type?: string | null
          stable_chart?: Json | null
          start_date?: string | null
          starting_rider_number?: number | null
          status?: string | null
          ticket_close?: string | null
          ticket_open?: string | null
          timezone?: string | null
          vendor_agreement_text?: string | null
          vendor_document_requirements?: Json | null
          vendor_map_path?: string | null
          vendor_map_url?: string | null
          venue_id?: string | null
          venue_name?: string | null
          waiver_approved_at?: string | null
          waiver_approved_text?: string | null
          waiver_text?: string | null
        }
        Update: {
          created_at?: string
          date_label?: string | null
          day_end_times?: Json | null
          day_start_times?: Json | null
          disciplines?: Json | null
          document_requirements?: Json | null
          end_date?: string | null
          expenses?: Json | null
          governing_bodies?: Json | null
          id?: string
          locations?: Json | null
          logo_path?: string | null
          manual_horses?: Json | null
          merch_items?: Json | null
          merchandise_enabled?: boolean | null
          name?: string
          org_id?: string
          published?: boolean | null
          published_at?: string | null
          runner_state?: Json | null
          schedule_extras?: Json | null
          schedule_prefs?: Json | null
          selected_template?: string | null
          show_details?: Json | null
          show_image_path?: string | null
          show_type?: string | null
          stable_chart?: Json | null
          start_date?: string | null
          starting_rider_number?: number | null
          status?: string | null
          ticket_close?: string | null
          ticket_open?: string | null
          timezone?: string | null
          vendor_agreement_text?: string | null
          vendor_document_requirements?: Json | null
          vendor_map_path?: string | null
          vendor_map_url?: string | null
          venue_id?: string | null
          venue_name?: string | null
          waiver_approved_at?: string | null
          waiver_approved_text?: string | null
          waiver_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shows_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shows_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_assignments: {
        Row: {
          can_scratch_skip_dq: boolean | null
          can_view_money: boolean | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_steward: boolean | null
          last_name: string | null
          name: string
          permissions: Json | null
          phone: string | null
          role: string
          show_id: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          can_scratch_skip_dq?: boolean | null
          can_view_money?: boolean | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_steward?: boolean | null
          last_name?: string | null
          name: string
          permissions?: Json | null
          phone?: string | null
          role: string
          show_id: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          can_scratch_skip_dq?: boolean | null
          can_view_money?: boolean | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_steward?: boolean | null
          last_name?: string | null
          name?: string
          permissions?: Json | null
          phone?: string | null
          role?: string
          show_id?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_assignments_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      test_templates: {
        Row: {
          arena_size: string | null
          collectives: Json | null
          created_at: string
          discipline: string | null
          governing_body: string | null
          id: string
          level: string | null
          max_points: number | null
          movements: Json | null
          name: string
          org_id: string
          penalties: Json | null
          ride_time: string | null
          scoring_config: Json | null
          scoring_method: string | null
          sections: Json | null
          sheet_type: string | null
          source_label: string | null
          updated_at: string
          version_year: string | null
        }
        Insert: {
          arena_size?: string | null
          collectives?: Json | null
          created_at?: string
          discipline?: string | null
          governing_body?: string | null
          id?: string
          level?: string | null
          max_points?: number | null
          movements?: Json | null
          name: string
          org_id: string
          penalties?: Json | null
          ride_time?: string | null
          scoring_config?: Json | null
          scoring_method?: string | null
          sections?: Json | null
          sheet_type?: string | null
          source_label?: string | null
          updated_at?: string
          version_year?: string | null
        }
        Update: {
          arena_size?: string | null
          collectives?: Json | null
          created_at?: string
          discipline?: string | null
          governing_body?: string | null
          id?: string
          level?: string | null
          max_points?: number | null
          movements?: Json | null
          name?: string
          org_id?: string
          penalties?: Json | null
          ride_time?: string | null
          scoring_config?: Json | null
          scoring_method?: string | null
          sections?: Json | null
          sheet_type?: string | null
          source_label?: string | null
          updated_at?: string
          version_year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          country: string | null
          created_at: string
          email: string
          id: string
          name: string
          onboarded_at: string | null
          org_id: string | null
          platform_role: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          onboarded_at?: string | null
          org_id?: string | null
          platform_role?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          onboarded_at?: string | null
          org_id?: string | null
          platform_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_booking_items: {
        Row: {
          booking_id: string
          id: string
          qty: number | null
          vendor_item_id: string
        }
        Insert: {
          booking_id: string
          id?: string
          qty?: number | null
          vendor_item_id: string
        }
        Update: {
          booking_id?: string
          id?: string
          qty?: number | null
          vendor_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "vendor_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_booking_items_vendor_item_id_fkey"
            columns: ["vendor_item_id"]
            isOneToOne: false
            referencedRelation: "vendor_items"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_bookings: {
        Row: {
          additional_charges: Json | null
          additional_charges_total: number | null
          agreement_signed_at: string | null
          agreement_signed_name: string | null
          agreement_signed_text: string | null
          amount_total: number | null
          contact: string | null
          contact_name: string | null
          created_at: string
          document_uploads: Json | null
          fee_total: number | null
          id: string
          name: string
          paid_at: string | null
          phone: string | null
          products_offered: string | null
          refunded_amount: number | null
          show_id: string
          special_requests: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_payment_method_id: string | null
          website: string | null
        }
        Insert: {
          additional_charges?: Json | null
          additional_charges_total?: number | null
          agreement_signed_at?: string | null
          agreement_signed_name?: string | null
          agreement_signed_text?: string | null
          amount_total?: number | null
          contact?: string | null
          contact_name?: string | null
          created_at?: string
          document_uploads?: Json | null
          fee_total?: number | null
          id?: string
          name: string
          paid_at?: string | null
          phone?: string | null
          products_offered?: string | null
          refunded_amount?: number | null
          show_id: string
          special_requests?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_method_id?: string | null
          website?: string | null
        }
        Update: {
          additional_charges?: Json | null
          additional_charges_total?: number | null
          agreement_signed_at?: string | null
          agreement_signed_name?: string | null
          agreement_signed_text?: string | null
          amount_total?: number | null
          contact?: string | null
          contact_name?: string | null
          created_at?: string
          document_uploads?: Json | null
          fee_total?: number | null
          id?: string
          name?: string
          paid_at?: string | null
          phone?: string | null
          products_offered?: string | null
          refunded_amount?: number | null
          show_id?: string
          special_requests?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_method_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_bookings_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_items: {
        Row: {
          enabled: boolean | null
          id: string
          name: string
          price: number | null
          qty: number | null
          show_id: string
        }
        Insert: {
          enabled?: boolean | null
          id?: string
          name: string
          price?: number | null
          qty?: number | null
          show_id: string
        }
        Update: {
          enabled?: boolean | null
          id?: string
          name?: string
          price?: number | null
          qty?: number | null
          show_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_items_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          city: string | null
          contact: string | null
          country: string | null
          created_at: string
          id: string
          name: string
          org_id: string
          phone: string | null
          region: string | null
          rings: Json | null
          stables: Json | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name: string
          org_id: string
          phone?: string | null
          region?: string | null
          rings?: Json | null
          stables?: Json | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          phone?: string | null
          region?: string | null
          rings?: Json | null
          stables?: Json | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venues_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      waiver_signatures: {
        Row: {
          full_name: string
          id: string
          rider_id: string
          show_id: string
          signature_date: string | null
          signed_at: string
        }
        Insert: {
          full_name: string
          id?: string
          rider_id: string
          show_id: string
          signature_date?: string | null
          signed_at?: string
        }
        Update: {
          full_name?: string
          id?: string
          rider_id?: string
          show_id?: string
          signature_date?: string | null
          signed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiver_signatures_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiver_signatures_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      abandon_stale_orders: { Args: never; Returns: undefined }
      booking_is_pending: {
        Args: { target_booking_id: string }
        Returns: boolean
      }
      booking_show_id: { Args: { target_booking_id: string }; Returns: string }
      can_access_org: { Args: { target_org_id: string }; Returns: boolean }
      can_manage_show: { Args: { target_show_id: string }; Returns: boolean }
      can_view_show: { Args: { target_show_id: string }; Returns: boolean }
      class_results_published: {
        Args: { target_class_id: string }
        Returns: boolean
      }
      class_show_id: { Args: { target_class_id: string }; Returns: string }
      current_org_id: { Args: never; Returns: string }
      current_platform_role: { Args: never; Returns: string }
      delete_division: { Args: { division_id: string }; Returns: undefined }
      entry_is_own: { Args: { target_entry_id: string }; Returns: boolean }
      entry_is_own_and_published: {
        Args: { target_entry_id: string }
        Returns: boolean
      }
      entry_show_id: { Args: { target_entry_id: string }; Returns: string }
      has_show_permission: {
        Args: { permission_key: string; target_show_id: string }
        Returns: boolean
      }
      has_staff_assignment: {
        Args: { allowed_roles?: string[]; target_show_id: string }
        Returns: boolean
      }
      has_staff_on_org: { Args: { target_org_id: string }; Returns: boolean }
      horse_in_approvable_show: {
        Args: { target_horse_id: string }
        Returns: boolean
      }
      horse_in_viewable_show: {
        Args: { target_horse_id: string }
        Returns: boolean
      }
      is_rider: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      merge_score_json: {
        Args: {
          p_class_id: string
          p_entry_id: string
          p_field: string
          p_patch: Json
          p_seat_id: string
        }
        Returns: undefined
      }
      org_is_public: { Args: { target_org_id: string }; Returns: boolean }
      rename_division: {
        Args: { division_id: string; new_name: string }
        Returns: undefined
      }
      rider_in_viewable_show: {
        Args: { target_rider_id: string }
        Returns: boolean
      }
      safe_uuid: { Args: { value: string }; Returns: string }
      show_is_publicly_visible: {
        Args: { target_show_id: string }
        Returns: boolean
      }
      show_is_published: { Args: { target_show_id: string }; Returns: boolean }
      storage_show_id: { Args: { object_name: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
