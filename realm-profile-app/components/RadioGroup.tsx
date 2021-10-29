import React, { useState } from 'react';
import styled from 'styled-components';
import RadioButton from '@button-inc/bcgov-theme/RadioButton';

const HoritonzalRadioButton = styled(RadioButton)`
  display: inline-block;
  margin-right: 8px;
`;

interface RadioGroupOptions {
  value: string;
  name: string;
}

interface Props {
  groupId: string;
  options: RadioGroupOptions[];
  direction: 'horizontal' | 'vertical';
  onChange: (v1: string, v2: string) => void;
  style?: any;
}

function RadioGroup({ groupId, options, direction, onChange, style = {} }: Props) {
  const handleChange = (value: string) => {
    onChange(groupId, value);
  };

  const Radio = direction === 'horizontal' ? HoritonzalRadioButton : RadioButton;

  return (
    <div style={{ display: direction === 'horizontal' ? 'inline-block' : 'block', ...style }}>
      {options.map(({ name, value }) => {
        return <Radio key={value} label={name} name={groupId} onChange={() => handleChange(value)} />;
      })}
    </div>
  );
}

export default RadioGroup;
