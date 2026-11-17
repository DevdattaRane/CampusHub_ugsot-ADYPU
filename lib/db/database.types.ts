export type Database = {
  public: {
    Tables: {
      event_catalog: {
        Row: {
          id: string;
          title: string;
          capacity: number;
          registration_deadline: string;
          event_type: 'event' | 'hackathon';
          team_size_min: number | null;
          team_size_max: number | null;
          theme: string | null;
          prize: string | null;
          rules: string[];
        };
        Insert: {
          id: string;
          title: string;
          capacity: number;
          registration_deadline: string;
          event_type?: 'event' | 'hackathon';
          team_size_min?: number | null;
          team_size_max?: number | null;
          theme?: string | null;
          prize?: string | null;
          rules?: string[];
        };
        Update: Partial<Database['public']['Tables']['event_catalog']['Insert']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          course_year: string | null;
          role: 'student' | 'organizer';
          github_username: string | null;
          skills: string[] | null;
          bio: string | null;
          is_hidden_from_leaderboard: boolean;
          interests: string[];
          goals: string[];
          onboarding_completed: boolean;
          is_profile_private: boolean;
          is_suspended: boolean;
          warning_count: number;
          suspension_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          course_year?: string | null;
          role?: 'student' | 'organizer';
          github_username?: string | null;
          skills?: string[] | null;
          bio?: string | null;
          is_hidden_from_leaderboard?: boolean;
          interests?: string[];
          goals?: string[];
          onboarding_completed?: boolean;
          is_profile_private?: boolean;
          is_suspended?: boolean;
          warning_count?: number;
          suspension_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      event_registrations: {
        Row: { id: string; event_id: string; user_id: string; registered_at: string };
        Insert: { id?: string; event_id: string; user_id: string; registered_at?: string };
        Update: Partial<Database['public']['Tables']['event_registrations']['Insert']>;
        Relationships: [];
      };
      event_announcements: {
        Row: {
          id: string;
          event_id: string;
          author_id: string;
          author_name: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          author_id: string;
          author_name: string;
          message: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['event_announcements']['Insert']>;
        Relationships: [];
      };
      event_teams: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          leader_id: string;
          leader_email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          leader_id: string;
          leader_email: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['event_teams']['Insert']>;
        Relationships: [];
      };
      event_team_members: {
        Row: {
          id: string;
          event_id: string;
          team_id: string;
          member_email: string;
          email_key: string;
          created_at: string;
        };
        Insert: {
          id?: string; event_id: string; team_id: string; member_email: string; created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['event_team_members']['Insert']>;
        Relationships: [];
      };
      event_attendance: {
        Row: {
          event_id: string; user_id: string; status: 'present' | 'absent'; updated_at: string;
        };
        Insert: {
          event_id: string; user_id: string; status: 'present' | 'absent'; updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['event_attendance']['Insert']>;
        Relationships: [];
      };
      event_certificates: {
        Row: {
          id: string; event_id: string; user_id: string; issued_at: string;
        };
        Insert: { id?: string; event_id: string; user_id: string; issued_at?: string };
        Update: Partial<Database['public']['Tables']['event_certificates']['Insert']>;
        Relationships: [];
      };
      forum_posts: {
        Row: {
          id: string;
          type: 'question' | 'discussion' | 'announcement';
          title: string;
          content: string;
          author_id: string;
          tags: string[];
          accepted_answer_id: string | null;
          is_reported: boolean;
          is_hidden: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: 'question' | 'discussion' | 'announcement';
          title: string;
          content: string;
          author_id: string;
          tags?: string[];
          accepted_answer_id?: string | null;
          is_reported?: boolean;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['forum_posts']['Insert']>;
        Relationships: [];
      };
      forum_answers: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          is_reported: boolean;
          is_hidden: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          content: string;
          is_reported?: boolean;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['forum_answers']['Insert']>;
        Relationships: [];
      };
      forum_upvotes: {
        Row: {
          user_id: string;
          item_type: 'post' | 'answer';
          item_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          item_type: 'post' | 'answer';
          item_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['forum_upvotes']['Insert']>;
        Relationships: [];
      };
      forum_reports: {
        Row: {
          id: string;
          reporter_id: string;
          item_type: 'post' | 'answer';
          item_id: string;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          item_type: 'post' | 'answer';
          item_id: string;
          reason?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['forum_reports']['Insert']>;
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          title: string;
          short_description: string;
          description: string;
          tech_stack: string[];
          github_url: string | null;
          demo_url: string | null;
          image_url: string | null;
          looking_for_collaborators: boolean;
          roles_needed: string[];
          owner_id: string;
          is_hidden: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          short_description: string;
          description: string;
          tech_stack?: string[];
          github_url?: string | null;
          demo_url?: string | null;
          image_url?: string | null;
          looking_for_collaborators?: boolean;
          roles_needed?: string[];
          owner_id: string;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
        Relationships: [];
      };
      project_likes: {
        Row: { user_id: string; project_id: string; created_at: string };
        Insert: { user_id: string; project_id: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['project_likes']['Insert']>;
        Relationships: [];
      };
      project_bookmarks: {
        Row: { user_id: string; project_id: string; created_at: string };
        Insert: { user_id: string; project_id: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['project_bookmarks']['Insert']>;
        Relationships: [];
      };
      project_comments: {
        Row: { id: string; project_id: string; user_id: string; content: string; is_hidden: boolean; created_at: string };
        Insert: { id?: string; project_id: string; user_id: string; content: string; is_hidden?: boolean; created_at?: string };
        Update: Partial<Database['public']['Tables']['project_comments']['Insert']>;
        Relationships: [];
      };
      project_collaborations: {
        Row: {
          id: string;
          project_id: string;
          sender_id: string;
          message: string;
          role_interested: string;
          status: 'pending' | 'accepted' | 'declined';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          sender_id: string;
          message: string;
          role_interested?: string;
          status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['project_collaborations']['Insert']>;
        Relationships: [];
      };
      mentor_profiles: {
        Row: {
          id: string;
          user_id: string;
          bio: string;
          skills: string[];
          areas: string[];
          availability_slots: string[];
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bio: string;
          skills?: string[];
          areas?: string[];
          availability_slots?: string[];
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['mentor_profiles']['Insert']>;
        Relationships: [];
      };
      mentorship_sessions: {
        Row: {
          id: string;
          mentor_id: string;
          mentee_id: string;
          slot: string;
          date: string;
          topic: string;
          notes: string;
          status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mentor_id: string;
          mentee_id: string;
          slot: string;
          date: string;
          topic: string;
          notes?: string;
          status?: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['mentorship_sessions']['Insert']>;
        Relationships: [];
      };
      code_reviews: {
        Row: {
          id: string;
          requester_id: string;
          title: string;
          github_url: string | null;
          code_snippet: string | null;
          language: string;
          notes: string;
          mentor_id: string | null;
          feedback: string | null;
          status: 'open' | 'claimed' | 'reviewed' | 'resolved';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          title: string;
          github_url?: string | null;
          code_snippet?: string | null;
          language?: string;
          notes: string;
          mentor_id?: string | null;
          feedback?: string | null;
          status?: 'open' | 'claimed' | 'reviewed' | 'resolved';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['code_reviews']['Insert']>;
        Relationships: [];
      };
      opportunities: {
        Row: {
          id: string;
          creator_id: string | null;
          title: string;
          organization: string;
          category: 'Internships' | 'Open-source programs' | 'Hackathons' | 'Fellowships' | 'Competitions' | 'Research';
          description: string;
          link: string;
          deadline: string;
          location: string;
          eligibility: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id?: string | null;
          title: string;
          organization: string;
          category: 'Internships' | 'Open-source programs' | 'Hackathons' | 'Fellowships' | 'Competitions' | 'Research';
          description: string;
          link: string;
          deadline: string;
          location?: string;
          eligibility?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['opportunities']['Insert']>;
        Relationships: [];
      };
      opportunity_bookmarks: {
        Row: {
          user_id: string;
          opportunity_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          opportunity_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['opportunity_bookmarks']['Insert']>;
        Relationships: [];
      };
      point_rules: {
        Row: {
          action_key: string;
          points: number;
          category: 'events' | 'projects' | 'forum' | 'mentorship';
          description: string;
        };
        Insert: {
          action_key: string;
          points: number;
          category: 'events' | 'projects' | 'forum' | 'mentorship';
          description: string;
        };
        Update: Partial<Database['public']['Tables']['point_rules']['Insert']>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          email_notifications: boolean;
          notify_team_invites: boolean;
          notify_event_updates: boolean;
          notify_mentorship: boolean;
          notify_forum: boolean;
          notify_projects: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email_notifications?: boolean;
          notify_team_invites?: boolean;
          notify_event_updates?: boolean;
          notify_mentorship?: boolean;
          notify_forum?: boolean;
          notify_projects?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notification_preferences']['Insert']>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          item_type: 'forum_post' | 'forum_answer' | 'project' | 'project_comment' | 'user';
          item_id: string;
          reason: string;
          details: string | null;
          status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
          moderator_id: string | null;
          resolution_notes: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          item_type: 'forum_post' | 'forum_answer' | 'project' | 'project_comment' | 'user';
          item_id: string;
          reason: string;
          details?: string | null;
          status?: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
          moderator_id?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
        Relationships: [];
      };
      moderation_logs: {
        Row: {
          id: string;
          moderator_id: string;
          action: string;
          target_type: string;
          target_id: string;
          details: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          moderator_id: string;
          action: string;
          target_type: string;
          target_id: string;
          details?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['moderation_logs']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_event_registration_statuses: {
        Args: { p_event_ids: string[] };
        Returns: {
          event_id: string;
          capacity: number;
          registration_deadline: string;
          seats_left: number;
          is_registered: boolean;
          registration_open: boolean;
        }[];
      };
      register_for_event: {
        Args: { p_event_id: string };
        Returns: {
          result: string;
          seats_left: number;
          capacity: number;
          registration_deadline: string;
        }[];
      };
      cancel_event_registration: {
        Args: { p_event_id: string };
        Returns: boolean;
      };
      create_hackathon_team: {
        Args: { p_event_id: string; p_name: string; p_member_emails: string[] };
        Returns: string;
      };
      verify_certificate: {
        Args: { p_certificate_id: string };
        Returns: {
          certificate_id: string;
          event_id: string;
          event_title: string;
          attendee_name: string;
          issued_at: string;
          is_valid: boolean;
        }[];
      };
      issue_event_certificate: {
        Args: { p_event_id: string; p_user_id: string };
        Returns: string;
      };
      get_leaderboard: {
        Args: {
          p_time_filter?: string;
          p_category_filter?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          user_id: string;
          full_name: string;
          email: string;
          course_year: string | null;
          github_username: string | null;
          events_points: number;
          projects_points: number;
          forum_points: number;
          mentorship_points: number;
          total_points: number;
          score: number;
          rank: number;
          badges: string[];
          first_activity_at: string;
        }[];
      };
      get_user_leaderboard_position: {
        Args: {
          p_user_id: string;
          p_time_filter?: string;
          p_category_filter?: string;
        };
        Returns: {
          user_id: string;
          rank: number;
          score: number;
          total_points: number;
          points_to_next_rank: number;
          next_rank_score: number;
          badges: string[];
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
