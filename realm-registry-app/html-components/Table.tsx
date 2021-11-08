import React from 'react';
import styled from 'styled-components';

const Table = styled.table`
  width: 100%;
  -webkit-box-shadow: none;
  box-shadow: none;
  text-align: left;
  border-collapse: separate;
  border-spacing: 0 5px;

  & thead {
    font-size: 12px;
    color: #777777;
  }

  & tbody {
    font-size: 16px;

    tr {
      height: 60px;
      background-color: #f8f8f8;
      &:hover {
        background-color: #fff7d5;
      }
      &.active {
        background-color: #ffed9f;
      }
    }
  }

  th:first-child,
  td:first-child {
    padding-left: 1em;
  }

  & th,
  & td {
    border: none;
  }
`;

export default Table;
