import React from 'react';
import styled from 'styled-components';

type HorizontalAlign = 'left' | 'right' | 'center' | 'none';
type MarginUnit = 'px' | 'em' | 'rem';
export interface MediaRule {
  maxWidth?: number;
  width?: number;
  marginTop?: number;
  marginLeft?: number;
  marginRight?: number;
  marginUnit?: MarginUnit;
  horizontalAlign?: HorizontalAlign;
}

export const defaultRules: MediaRule[] = [
  {
    maxWidth: 767,
    marginTop: 10,
  },
  {
    maxWidth: 991,
    width: 723,
    marginTop: 20,
  },
  {
    maxWidth: 1199,
    width: 933,
    marginTop: 50,
  },
  {
    width: 1127,
    marginTop: 80,
  },
];

const getHorizontalMarginStyle = (
  horizontalAlign: HorizontalAlign,
  marginLeft?: number,
  marginRight?: number,
  marginUnit?: MarginUnit,
) => {
  if (horizontalAlign === 'left') {
    return `
      margin-right: auto !important;
  `;
  } else if (horizontalAlign === 'right') {
    return `
      margin-left: auto !important;
  `;
  } else if (horizontalAlign === 'center') {
    return `
      margin-left: auto !important;
      margin-right: auto !important;
  `;
  } else {
    let margin = '';
    if (marginLeft) margin += `margin-left: ${marginLeft}${marginUnit} !important;`;
    if (marginRight) margin += `margin-right: ${marginRight}${marginUnit} !important;`;
    return margin;
  }
};

const Container = styled.div<{ rules: MediaRule[] }>`
  display: block;
  max-width: 100% !important;

  ${(props) =>
    props.rules.map((rule: MediaRule, index: number) => {
      if (index === 0) {
        return `@media only screen and (max-width: ${rule.maxWidth}px) {
          & {
            ${rule.marginTop && `margin-top: ${rule.marginTop}px;`}
            width: auto !important;
            ${getHorizontalMarginStyle(rule.horizontalAlign || 'none', 1, 1, 'em')}
          }
        }`;
      } else if (index === props.rules.length - 1) {
        return `@media only screen and (min-width: ${(props.rules[index - 1].maxWidth || 0) + 1}px) {
          & {
            ${rule.marginTop && `margin-top: ${rule.marginTop}px;`}
            width: ${rule.width}px;
            ${getHorizontalMarginStyle(
              rule.horizontalAlign || 'center',
              rule.marginLeft,
              rule.marginRight,
              rule.marginUnit,
            )}
          }
        }`;
      } else {
        return `@media only screen and (min-width: ${(props.rules[index - 1].maxWidth || 0) + 1}px) and (max-width: ${
          rule.maxWidth
        }px) {
          & {
            ${rule.marginTop && `margin-top: ${rule.marginTop}px;`}
            width: ${rule.width}px;
            ${getHorizontalMarginStyle(
              rule.horizontalAlign || 'center',
              rule.marginLeft,
              rule.marginRight,
              rule.marginUnit,
            )}
          }
        }`;
      }
    })}
`;

export default Container;
