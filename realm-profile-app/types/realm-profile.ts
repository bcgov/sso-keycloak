export interface RealmProfile {
  id: string;
  realm: string;
  displayName: string;
  product_name: string;
  openshift_namespace: string;
  product_owner_email: string;
  product_owner_idir_userid: string;
  product_owner_name: string;
  technical_contact_email: string;
  technical_contact_idir_userid: string;
  technical_contact_name: string;
  willing_to_move: string;
  when_to_move: string;
  idps: string[];
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface ModalData {
  willing_to_move?: string;
  when_to_move?: string;
}
