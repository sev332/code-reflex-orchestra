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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          capabilities: string[]
          configuration: Json | null
          created_at: string
          current_task_id: string | null
          id: string
          last_active_at: string | null
          metadata: Json | null
          name: string
          performance_score: number | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          capabilities?: string[]
          configuration?: Json | null
          created_at?: string
          current_task_id?: string | null
          id?: string
          last_active_at?: string | null
          metadata?: Json | null
          name: string
          performance_score?: number | null
          role: string
          status?: string
          updated_at?: string
        }
        Update: {
          capabilities?: string[]
          configuration?: Json | null
          created_at?: string
          current_task_id?: string | null
          id?: string
          last_active_at?: string | null
          metadata?: Json | null
          name?: string
          performance_score?: number | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_context_memory: {
        Row: {
          access_frequency: number
          content: Json
          context_type: string
          created_at: string
          id: string
          importance: number
          last_accessed: string
          related_memories: string[] | null
          updated_at: string
          validation_status: string
        }
        Insert: {
          access_frequency?: number
          content: Json
          context_type: string
          created_at?: string
          id?: string
          importance?: number
          last_accessed?: string
          related_memories?: string[] | null
          updated_at?: string
          validation_status?: string
        }
        Update: {
          access_frequency?: number
          content?: Json
          context_type?: string
          created_at?: string
          id?: string
          importance?: number
          last_accessed?: string
          related_memories?: string[] | null
          updated_at?: string
          validation_status?: string
        }
        Relationships: []
      }
      ai_self_audits: {
        Row: {
          context_efficiency: number
          created_at: string
          id: string
          improvement_suggestions: string[] | null
          metrics: Json | null
          theory_success_rate: number
          validation_accuracy: number
        }
        Insert: {
          context_efficiency: number
          created_at?: string
          id?: string
          improvement_suggestions?: string[] | null
          metrics?: Json | null
          theory_success_rate: number
          validation_accuracy: number
        }
        Update: {
          context_efficiency?: number
          created_at?: string
          id?: string
          improvement_suggestions?: string[] | null
          metrics?: Json | null
          theory_success_rate?: number
          validation_accuracy?: number
        }
        Relationships: []
      }
      background_agents: {
        Row: {
          accuracy_rate: number | null
          avg_processing_time: number | null
          capabilities: string[]
          created_at: string
          current_task_id: string | null
          id: string
          name: string
          purpose: string
          status: string
          theories_validated: number | null
          updated_at: string
        }
        Insert: {
          accuracy_rate?: number | null
          avg_processing_time?: number | null
          capabilities?: string[]
          created_at?: string
          current_task_id?: string | null
          id?: string
          name: string
          purpose: string
          status?: string
          theories_validated?: number | null
          updated_at?: string
        }
        Update: {
          accuracy_rate?: number | null
          avg_processing_time?: number | null
          capabilities?: string[]
          created_at?: string
          current_task_id?: string | null
          id?: string
          name?: string
          purpose?: string
          status?: string
          theories_validated?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "background_agents_current_task_id_fkey"
            columns: ["current_task_id"]
            isOneToOne: false
            referencedRelation: "theory_validations"
            referencedColumns: ["id"]
          },
        ]
      }
      cmc_evidence_graph: {
        Row: {
          author: string | null
          citation_count: number | null
          content: string
          content_id: string
          content_type: string
          created_at: string | null
          created_date: string | null
          id: string
          last_cited_at: string | null
          source: string
          tags: string[] | null
        }
        Insert: {
          author?: string | null
          citation_count?: number | null
          content: string
          content_id: string
          content_type: string
          created_at?: string | null
          created_date?: string | null
          id?: string
          last_cited_at?: string | null
          source: string
          tags?: string[] | null
        }
        Update: {
          author?: string | null
          citation_count?: number | null
          content?: string
          content_id?: string
          content_type?: string
          created_at?: string | null
          created_date?: string | null
          id?: string
          last_cited_at?: string | null
          source?: string
          tags?: string[] | null
        }
        Relationships: []
      }
      cmc_memories: {
        Row: {
          access_count: number | null
          compression_ratio: number | null
          content: string
          content_hash: string
          created_at: string | null
          dependency_delta: number | null
          head_span: number | null
          id: string
          importance: number | null
          index_depth_score: number | null
          is_compressed: boolean | null
          last_accessed_at: string | null
          original_token_count: number | null
          parent_tags: string[] | null
          quality_score: number | null
          retrieval_score: number | null
          semantic_embedding: string | null
          session_id: string | null
          source: string | null
          tags: string[] | null
          tail_span: number | null
          tier: string
          token_count: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_count?: number | null
          compression_ratio?: number | null
          content: string
          content_hash: string
          created_at?: string | null
          dependency_delta?: number | null
          head_span?: number | null
          id?: string
          importance?: number | null
          index_depth_score?: number | null
          is_compressed?: boolean | null
          last_accessed_at?: string | null
          original_token_count?: number | null
          parent_tags?: string[] | null
          quality_score?: number | null
          retrieval_score?: number | null
          semantic_embedding?: string | null
          session_id?: string | null
          source?: string | null
          tags?: string[] | null
          tail_span?: number | null
          tier: string
          token_count: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_count?: number | null
          compression_ratio?: number | null
          content?: string
          content_hash?: string
          created_at?: string | null
          dependency_delta?: number | null
          head_span?: number | null
          id?: string
          importance?: number | null
          index_depth_score?: number | null
          is_compressed?: boolean | null
          last_accessed_at?: string | null
          original_token_count?: number | null
          parent_tags?: string[] | null
          quality_score?: number | null
          retrieval_score?: number | null
          semantic_embedding?: string | null
          session_id?: string | null
          source?: string | null
          tags?: string[] | null
          tail_span?: number | null
          tier?: string
          token_count?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cmc_reasoning_chains: {
        Row: {
          agents: Json
          assumptions: string[] | null
          confidence: number | null
          created_at: string | null
          duration_ms: number | null
          final_answer: string
          healing_events: Json | null
          id: string
          logit_variance: number | null
          provenance_coverage: number | null
          semantic_entropy: number | null
          session_id: string | null
          steps: Json
          support: Json
          token_budget: number
          tokens_used: number
          trace_id: string
          user_id: string | null
          user_query: string
        }
        Insert: {
          agents: Json
          assumptions?: string[] | null
          confidence?: number | null
          created_at?: string | null
          duration_ms?: number | null
          final_answer: string
          healing_events?: Json | null
          id?: string
          logit_variance?: number | null
          provenance_coverage?: number | null
          semantic_entropy?: number | null
          session_id?: string | null
          steps: Json
          support: Json
          token_budget: number
          tokens_used: number
          trace_id: string
          user_id?: string | null
          user_query: string
        }
        Update: {
          agents?: Json
          assumptions?: string[] | null
          confidence?: number | null
          created_at?: string | null
          duration_ms?: number | null
          final_answer?: string
          healing_events?: Json | null
          id?: string
          logit_variance?: number | null
          provenance_coverage?: number | null
          semantic_entropy?: number | null
          session_id?: string | null
          steps?: Json
          support?: Json
          token_budget?: number
          tokens_used?: number
          trace_id?: string
          user_id?: string | null
          user_query?: string
        }
        Relationships: []
      }
      cmc_tag_graph: {
        Row: {
          access_count: number | null
          created_at: string | null
          decay_tau: number | null
          id: string
          last_accessed_at: string | null
          parent_tag: string | null
          priority: number | null
          tag: string
        }
        Insert: {
          access_count?: number | null
          created_at?: string | null
          decay_tau?: number | null
          id?: string
          last_accessed_at?: string | null
          parent_tag?: string | null
          priority?: number | null
          tag: string
        }
        Update: {
          access_count?: number | null
          created_at?: string | null
          decay_tau?: number | null
          id?: string
          last_accessed_at?: string | null
          parent_tag?: string | null
          priority?: number | null
          tag?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          agent_id: string | null
          context: Json | null
          created_at: string
          human_participant_id: string | null
          id: string
          is_active: boolean | null
          session_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          context?: Json | null
          created_at?: string
          human_participant_id?: string | null
          id?: string
          is_active?: boolean | null
          session_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          context?: Json | null
          created_at?: string
          human_participant_id?: string | null
          id?: string
          is_active?: boolean | null
          session_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_analysis: {
        Row: {
          complexity_score: number | null
          created_at: string
          document_id: string
          entities: Json | null
          hierarchy_levels: number
          id: string
          key_topics: string[] | null
          master_summary: string | null
          readability_score: number | null
          structure: Json | null
          total_chunks: number
          updated_at: string
        }
        Insert: {
          complexity_score?: number | null
          created_at?: string
          document_id: string
          entities?: Json | null
          hierarchy_levels?: number
          id?: string
          key_topics?: string[] | null
          master_summary?: string | null
          readability_score?: number | null
          structure?: Json | null
          total_chunks?: number
          updated_at?: string
        }
        Update: {
          complexity_score?: number | null
          created_at?: string
          document_id?: string
          entities?: Json | null
          hierarchy_levels?: number
          id?: string
          key_topics?: string[] | null
          master_summary?: string | null
          readability_score?: number | null
          structure?: Json | null
          total_chunks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_analysis_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          chunk_type: string
          content: string
          created_at: string
          document_id: string
          end_position: number | null
          id: string
          metadata: Json | null
          parent_chunk_id: string | null
          start_position: number | null
          tags: string[] | null
        }
        Insert: {
          chunk_index: number
          chunk_type?: string
          content: string
          created_at?: string
          document_id: string
          end_position?: number | null
          id?: string
          metadata?: Json | null
          parent_chunk_id?: string | null
          start_position?: number | null
          tags?: string[] | null
        }
        Update: {
          chunk_index?: number
          chunk_type?: string
          content?: string
          created_at?: string
          document_id?: string
          end_position?: number | null
          id?: string
          metadata?: Json | null
          parent_chunk_id?: string | null
          start_position?: number | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_parent_chunk_id_fkey"
            columns: ["parent_chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      document_edit_history: {
        Row: {
          ai_reasoning: string | null
          chunk_id: string | null
          created_at: string
          document_id: string
          edit_prompt: string | null
          edit_type: string
          end_position: number | null
          id: string
          new_content: string
          original_content: string | null
          start_position: number | null
          user_id: string
        }
        Insert: {
          ai_reasoning?: string | null
          chunk_id?: string | null
          created_at?: string
          document_id: string
          edit_prompt?: string | null
          edit_type: string
          end_position?: number | null
          id?: string
          new_content: string
          original_content?: string | null
          start_position?: number | null
          user_id: string
        }
        Update: {
          ai_reasoning?: string | null
          chunk_id?: string | null
          created_at?: string
          document_id?: string
          edit_prompt?: string | null
          edit_type?: string
          end_position?: number | null
          id?: string
          new_content?: string
          original_content?: string | null
          start_position?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_edit_history_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_edit_history_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          google_cloud_path: string | null
          id: string
          mime_type: string
          processing_error: string | null
          processing_status: string
          storage_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          google_cloud_path?: string | null
          id?: string
          mime_type: string
          processing_error?: string | null
          processing_status?: string
          storage_type?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          google_cloud_path?: string | null
          id?: string
          mime_type?: string
          processing_error?: string | null
          processing_status?: string
          storage_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hil_interventions: {
        Row: {
          agent_id: string | null
          created_at: string
          human_input: string | null
          id: string
          intervention_type: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          status: string | null
          task_id: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          human_input?: string | null
          id?: string
          intervention_type: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          task_id?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          human_input?: string | null
          id?: string
          intervention_type?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hil_interventions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hil_interventions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_entries: {
        Row: {
          access_count: number | null
          content: string
          created_at: string
          entry_type: string
          id: string
          importance_score: number | null
          last_accessed_at: string | null
          metadata: Json | null
          source: string
          source_id: string | null
          tags: string[] | null
        }
        Insert: {
          access_count?: number | null
          content: string
          created_at?: string
          entry_type?: string
          id?: string
          importance_score?: number | null
          last_accessed_at?: string | null
          metadata?: Json | null
          source: string
          source_id?: string | null
          tags?: string[] | null
        }
        Update: {
          access_count?: number | null
          content?: string
          created_at?: string
          entry_type?: string
          id?: string
          importance_score?: number | null
          last_accessed_at?: string | null
          metadata?: Json | null
          source?: string
          source_id?: string | null
          tags?: string[] | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          message_type: string | null
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_type?: string | null
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_type?: string | null
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          performance_metrics: Json | null
          template: string
          updated_at: string
          variables: string[] | null
          version: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          performance_metrics?: Json | null
          template: string
          updated_at?: string
          variables?: string[] | null
          version?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          performance_metrics?: Json | null
          template?: string
          updated_at?: string
          variables?: string[] | null
          version?: number | null
        }
        Relationships: []
      }
      system_events: {
        Row: {
          agent_id: string | null
          created_at: string
          data: Json | null
          description: string | null
          event_type: string
          id: string
          severity: string | null
          task_id: string | null
          title: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          event_type: string
          id?: string
          severity?: string | null
          task_id?: string | null
          title: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          event_type?: string
          id?: string
          severity?: string | null
          task_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_duration_ms: number | null
          assigned_agent_id: string | null
          completed_at: string | null
          created_at: string
          dependencies: string[] | null
          description: string | null
          estimated_duration_ms: number | null
          id: string
          inputs: Json | null
          outputs: Json | null
          parent_task_id: string | null
          priority: number | null
          progress: number | null
          started_at: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          actual_duration_ms?: number | null
          assigned_agent_id?: string | null
          completed_at?: string | null
          created_at?: string
          dependencies?: string[] | null
          description?: string | null
          estimated_duration_ms?: number | null
          id?: string
          inputs?: Json | null
          outputs?: Json | null
          parent_task_id?: string | null
          priority?: number | null
          progress?: number | null
          started_at?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          actual_duration_ms?: number | null
          assigned_agent_id?: string | null
          completed_at?: string | null
          created_at?: string
          dependencies?: string[] | null
          description?: string | null
          estimated_duration_ms?: number | null
          id?: string
          inputs?: Json | null
          outputs?: Json | null
          parent_task_id?: string | null
          priority?: number | null
          progress?: number | null
          started_at?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      theory_validations: {
        Row: {
          claims: string[]
          completed_at: string | null
          confidence_score: number | null
          created_at: string
          evidence: Json | null
          id: string
          mathematical_expressions: string[] | null
          priority: number
          required_sources: string[] | null
          sources: string[] | null
          status: string
          theory: string
          updated_at: string
          validation_methods: string[]
          validation_results: Json | null
        }
        Insert: {
          claims?: string[]
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          evidence?: Json | null
          id?: string
          mathematical_expressions?: string[] | null
          priority?: number
          required_sources?: string[] | null
          sources?: string[] | null
          status?: string
          theory: string
          updated_at?: string
          validation_methods?: string[]
          validation_results?: Json | null
        }
        Update: {
          claims?: string[]
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          evidence?: Json | null
          id?: string
          mathematical_expressions?: string[] | null
          priority?: number
          required_sources?: string[] | null
          sources?: string[] | null
          status?: string
          theory?: string
          updated_at?: string
          validation_methods?: string[]
          validation_results?: Json | null
        }
        Relationships: []
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
  public: {
    Enums: {},
  },
} as const
