<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=true displayInfo=false; section>
    <#if section = "header">
        ${msg("loginAccountTitle")}
    <#elseif section = "socialProviders">
        <#if social.providers??>
            <div id="kc-social-providers" class="${properties.kcFormSocialAccountSectionClass!}">
                <ul class="kc-social-links">
                    <#list social.providers as p>
                        <li class="kc-social-link">
                            <a id="social-${p.alias}" class="bcgov-primary mb-2" type="button" href="${p.loginUrl}">
                                <span class="kc-social-title ${properties.kcFormSocialAccountNameClass!}">${p.displayName!}</span>
                            </a>
                        </li>
                    </#list>
                </ul>
            </div>
        </#if>
    </#if>
</@layout.registrationLayout>
