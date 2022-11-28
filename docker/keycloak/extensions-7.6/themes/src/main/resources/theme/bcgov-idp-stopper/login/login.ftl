<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=true displayInfo=false; section>
    <#if section = "header">
        ${msg("loginAccountTitle")}
    <#elseif section = "socialProviders">
        <#if social.providers?? && (login.username)??>
            <div id="kc-social-providers" class="${properties.kcFormSocialAccountSectionClass!}">
                <ul class="kc-social-links">
                    <#assign idpContext = login.username?eval_json>
                    <#list social.providers as p>
                        <#if idpContext[p.alias]?has_content && idpContext[p.alias]["enabled"] == "true">
                        <li class="kc-social-link">
                            <a id="social-${p.alias}" class="bcgov-primary mb-2" type="button" href="${p.loginUrl}">
                                <span class="kc-social-title ${properties.kcFormSocialAccountNameClass!}">${p.displayName!}</span>
                                <#if idpContext[p.alias]["tooltip"]?has_content>
                                <span class="kc-social-icon" data-tooltip="${idpContext[p.alias]["tooltip"]}">
                                    <svg
                                        aria-hidden="true"
                                        focusable="false"
                                        data-prefix="fas"
                                        data-icon="circle-info"
                                        class="svg-inline--fa fa-circle-info"
                                        role="img"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 512 512"
                                        color="#fff"
                                    >
                                        <path
                                            fill="currentColor"
                                            d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-144c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32z"
                                        >
                                        </path>
                                    </svg>
                                </span>
                                </#if>
                            </a>
                        </li>
                        </#if>
                    </#list>
                </ul>
            </div>
        </#if>
    </#if>
</@layout.registrationLayout>
