import styled from 'styled-components';
import Modal from '@button-inc/bcgov-theme/Modal';

const CenteredModal = styled(Modal)`
  display: flex;
  align-items: center;

  & .pg-modal-main {
    margin: auto;
  }
`;

export default CenteredModal;
