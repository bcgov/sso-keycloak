export interface UserSession {
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
  client_roles: string[];
  idir_userid: string;
  [key: string]: any;
}
