export interface RealmProfile {
  id: string;
  realm: string;
  description: string;
  product_name: string;
  openshift_namespace: string;
  product_owner_email: string;
  product_owner_idir_userid: string;
  technical_contact_email: string;
  technical_contact_idir_userid: string;
  created_at: string;
  updated_at: string;
  [key: string]: string;
}
