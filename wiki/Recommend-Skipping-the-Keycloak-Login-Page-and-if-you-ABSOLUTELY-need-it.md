# We recommend to skip the Login Page but if you have a need for it, read on

As you've read in our guidance in setting up a keycloak client do's and don'ts [here](https://github.com/bcgov/sso-keycloak/wiki/Using-Your-SSO-Client#dos-and-donts), our recommendation is to skip the [keycloak login page](https://github.com/bcgov/sso-keycloak/wiki/Using-Your-SSO-Client#do-skip-the-keycloak-login-page) ie

**Do Skip the KeyCloak Login Page**
> In KeyCloak, if the realm that contains your client has more than one IDP configured, KeyCloak shows a page that prompts the user to select which IDP they want to log in with. Almost all teams have chosen to hide this page from their users by specifying the IDP as a query string parameter in the KeyCloak Authorization URI value behind their login button. The query string is 'kc_idp_hint'. (The IDPs available will depend on the standard realm in which your client exists.) By specifying the IDP in this way, the user will be redirected directly to the login page for the identity provider and will not see the KeyCloak login choice page at all.

**Need dedicated text for login page**

If you are a client of ours and have an **absolute** need to have a dedicated set of text for your login page, through [our app](https://bcgov.github.io/sso-requests), you can specify the text under the field setting **Keycloak Login Page Name**


![image](https://user-images.githubusercontent.com/56739669/171695377-60fa5c47-e867-4097-b140-6df8d5155cdd.png)

#### *Have any questions? We would love to hear from you.* [![Semantic description of image](https://user-images.githubusercontent.com/87393930/133688357-09f82374-ba18-4402-8089-c0a989dde882.png)][2]   <a href="mailto:bcgov.sso@gov.bc.ca?"><img src="https://user-images.githubusercontent.com/87393930/133690650-b706e658-27bf-4066-92ba-3a7d8a4593ef.png"/></a>



[2]: https://chat.developer.gov.bc.ca/channel/sso
[3]: https://[mail](mailto:bcgov.sso@gov.bc.ca)[email](mailto:bcgov.sso@gov.bc.ca)
