You've asked and we've listened, we've created the ability for you to create roles for your SSO integration.

### What are roles in the Common Hosted Single Sign On (CSS) App?

Roles identify a type or category of user. Admin, user, manager, and employee are all typical roles that may exist in an organization. Applications often assign access and permissions to specific roles rather than individual users as dealing with users can be too fine-grained and hard to manage.


The CSS App provides the ability to add roles to an integration. This concept is also known as Role-based access control (RBAC), a mechanism that restricts system access.

### Why use roles?

You can use roles to enable access to specific pages or data to only those users who connect, with efficiency, data security and simplicity under consideration.









### How to create a Role:
[View a quick video of how to create Roles](https://github.com/bcgov/sso-keycloak/assets/56739669/435f502a-aed8-49de-9ff7-f64dd4a38ff0), or continue reading the instructions below.


<!-- video from May 2023
[View a quick video of how to create Roles](https://user-images.githubusercontent.com/56739669/231529538-0e1efa5a-51df-401a-99c2-dbc964e8cac6.mp4), or continue reading the instructions below. -->


<!-- old video https://user-images.githubusercontent.com/56739669/167518486-89f03e3c-f7e4-4788-89d8-25729e107406.mp4 -->
### How to create a Role:
1. First, create your integration
1. Once your integration status becomes “Completed”, you can “Create a New Role” for each of your environments, under Role Management
1. Next, you can add users to your various roles, under Assign Users to Roles
1. Finally, configure your app to make use of these roles that are passed via the access token/payload

### Once you have your **JSON** Details and created a **Role**
1. Once your integration is in "completed" status, you will have your json details AND you have created at least one Role
1. Make sure you assign at least one person to this role under the "Assign Users to Role" section
1. Log in to your Application
1. Look for the Role you created in the client_roles attribute  View this [video at 1:35](https://user-images.githubusercontent.com/56739669/231529538-0e1efa5a-51df-401a-99c2-dbc964e8cac6.mp4)


### A couple of notes:
1. A Role can **only** be created once the integration status is “completed"
1. You have the ability to create different roles for each of the different environment(s) in your integration
1. When you select a role, the right hand side will show users assigned to that role
1. By deleting a role, you are also removing the role from the users assigned to the role....it’s on our backlog to allow to delete one user at a time
1. Any Team Member within your integration can create OR delete roles *
1. Any Team Member within your integration can see all users assigned to role

( * ) we've got it in our backlog to configure team admins to handle role management( create/delete roles) and team members to handle user assignment (add/remove users to roles)


## Service Account Role Management

Some client teams require roles to be created for their service accounts. Examples include granting  permissions to service accounts to access different endpoints of client API

We've heard from clients the need to create roles on service accounts and as a community member in our SHARED/STANDARD service, please keep in mind, that other teams may use the same role names as you. For this reason and for good security posture, your API end point checks should look at the `aud`. **Audience check is required if you have an API for your application and you have a standard integration.**


From the wisest of our team member "One final note which is paramount; securing your API endpoints. If you're using the standard realm then you'll have to use a combination of roles (created in CSS), issuer & audience (as well as the public key) to confirm the token is indeed valid for your API. Otherwise, other teams in the same realm would have the ability to make the same call"

***

***
