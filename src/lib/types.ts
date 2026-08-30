export type PolarRole =
  | "client"
  | "barber"
  | "owner_admin"
  | "designer_developer";

// Stage 4: Client Profile Card
export type CustomFieldType =
  | "text"
  | "number"
  | "boolean"
  | "single_select"
  | "multi_select"
  | "date";

export interface ClientProfileDetails {
  hair_type: string | null;
  hair_colour: string | null;
  scalp_condition: string | null;
  skin_sensitivity: string | null;
  allergies: string | null;
  emergency_contact: string | null;
  updated_at: string;
}

export interface CustomFieldDefinition {
  id: string;
  label: string;
  field_type: CustomFieldType;
  options: string[] | null;
  display_order: number;
}
