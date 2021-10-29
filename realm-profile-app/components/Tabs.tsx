import styled from 'styled-components';

const Tabs = styled.nav`
  display: flex;
  flex-wrap: wrap;
  padding-left: 0;
  margin-bottom: 0;
  list-style: none;
  border-bottom: 1px solid #dee2e6;

  .nav-link {
    margin-bottom: -1px;
    background: 0 0;
    border-top-left-radius: 0.25rem;
    border-top-right-radius: 0.25rem;

    display: block;
    padding: 0 1rem 0.5rem 1rem;

    color: #777777 !important;
    height: 30px !important;
    font-size: 18px !important;
    font-weight: 600 !important;
  }

  .nav-link.active {
    background-color: unset !important;
    border-bottom: 3px solid orange;
  }
`;

export default Tabs;
