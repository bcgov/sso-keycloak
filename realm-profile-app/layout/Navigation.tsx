import React from 'react';
import styled from 'styled-components';
import isFunction from 'lodash/isFunction';
import { BaseNavigation } from '@button-inc/bcgov-theme/Navigation';
import { BaseHeader } from '@button-inc/bcgov-theme/Header';
import { Bars, FaSVG } from '@button-inc/bcgov-theme/fontawesome';
import bcgovLogoSVG from '@button-inc/bcgov-theme/esm/svg/bcgov_logo';
import ResponsiveContainer, { MediaRule } from 'components/ResponsiveContainer';

const mediaRules: MediaRule[] = [
  {
    maxWidth: 900,
    marginTop: 0,
    marginLeft: 10,
    marginUnit: 'px',
    horizontalAlign: 'none',
  },
  {
    width: 480,
    marginTop: 0,
    marginLeft: 2.5,
    marginUnit: 'rem',
    horizontalAlign: 'none',
  },
];

const BannerLogo = styled.div`
  height: 90%;
  max-width: 180px;
`;

const Title = styled.h1`
  font-weight: normal;
  margin-top: 10px;
`;

const DEFAULT_MOBILE_BREAK_POINT = '900';

function Navigation(props: any) {
  const {
    title = '',
    onBannerClick = () => null,
    children,
    mobileMenu,
    mobileBreakPoint = DEFAULT_MOBILE_BREAK_POINT,
    rightSide,
  } = props;
  const context = { mobileBreakPoint };

  return (
    <BaseNavigation>
      <BaseHeader>
        <BaseHeader.Group className="banner">
          <ResponsiveContainer rules={mediaRules}>
            <BannerLogo onClick={onBannerClick}>{bcgovLogoSVG}</BannerLogo>
          </ResponsiveContainer>
        </BaseHeader.Group>
        <BaseHeader.Item collapse={mobileBreakPoint}>
          <Title>{isFunction(title) ? title(context) : title}</Title>
        </BaseHeader.Item>

        {rightSide && (
          <BaseHeader.Item
            collapse={mobileBreakPoint}
            style={{ marginLeft: 'auto', marginBottom: 'auto', marginTop: 'auto' }}
          >
            {rightSide}
          </BaseHeader.Item>
        )}

        <BaseHeader.Item
          expand={mobileBreakPoint}
          style={{ marginLeft: 'auto', fontSize: '2rem', marginBottom: 'auto', marginTop: 'auto' }}
        >
          <BaseNavigation.Toggle>
            <FaSVG>
              <path fill="currentColor" d={Bars} />
            </FaSVG>
          </BaseNavigation.Toggle>
        </BaseHeader.Item>
      </BaseHeader>

      <BaseHeader header="sub" collapse={mobileBreakPoint}>
        {children}
      </BaseHeader>
      <BaseNavigation.Sidebar>{mobileMenu ? mobileMenu() : children}</BaseNavigation.Sidebar>
    </BaseNavigation>
  );
}

export default Navigation;
