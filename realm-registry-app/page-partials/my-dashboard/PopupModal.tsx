import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import CenteredModal from 'components/CenteredModal';
import Button from '@button-inc/bcgov-theme/Button';
import Modal from '@button-inc/bcgov-theme/Modal';
import RadioGroup from 'components/RadioGroup';
import { answerSurvey } from 'services/survey';
import { ModalData } from 'types/realm-profile';

const AlignCenter = styled.div`
  text-align: center;
`;

const BoldItem = styled.li`
  font-weight: 700;

  & div {
    font-weight: 400;
  }

  & .italic {
    font-style: italic;
  }
`;

interface Props {
  open: boolean;
  onAnswer: (val: boolean) => void;
}

function PopupModal({ open, onAnswer }: Props) {
  const [data, setData] = useState<ModalData>({});

  useEffect(() => {
    window.location.hash = open ? 'realm-migration' : '#';
  }, [open]);

  const handleChange = (groupId: string, value: string) => {
    delete data.when_to_move;
    setData({ ...data, [groupId]: value });
  };

  const handleClose = async () => {
    const [, err] = await answerSurvey(data);
    if (err) onAnswer(false);
    else onAnswer(true);
    window.location.hash = '#';
  };

  return (
    <CenteredModal id="realm-migration">
      <Modal.Header>Standard Realm Migration</Modal.Header>
      <Modal.Content>
        <div>*Please complete the question below:</div>
        <hr />
        <ul>
          <BoldItem>
            Would you like to move your Custom realm to a Shard Realm?
            <RadioGroup
              style={{ marginLeft: '10px', float: 'right' }}
              groupId="willing_to_move"
              direction="horizontal"
              options={[
                { value: 'yes', name: 'Yes' },
                { value: 'no', name: 'No' },
              ]}
              onChange={handleChange}
            />
            <br />
            <br />
            <div className="italic">
              *If you have more than one realm, would you like to migrate at least one of them?
            </div>
          </BoldItem>
          {data.willing_to_move === 'no' && (
            <BoldItem>
              Would you be willing to migrate to a Standard Realm, within the following timeframes?
              <RadioGroup
                style={{ float: 'right' }}
                groupId="when_to_move"
                direction="horizontal"
                options={[
                  { value: '6month', name: '6 Month' },
                  { value: '12month', name: '12 Months' },
                  { value: 'notAnytimeSoon', name: 'Not Anytime Soon' },
                ]}
                onChange={handleChange}
              />
              <br />
              <br />
            </BoldItem>
          )}
          {(data.willing_to_move === 'yes' || data.when_to_move === '6month' || data.when_to_move === '12month') && (
            <BoldItem>
              Thank you for choosing to migrate to a Custom realm. The SSO team will send you an email with next steps,
              within the next 5 business days.
            </BoldItem>
          )}
          {data.willing_to_move === 'no' && data.when_to_move === 'notAnytimeSoon' && (
            <BoldItem>
              Thank you for your response. The SSO team will reach out to you to understand your business constraints
              about migrating to a Standard Realm.
            </BoldItem>
          )}
        </ul>
        {data.willing_to_move === 'yes' || (data.willing_to_move === 'no' && data.when_to_move) ? (
          <AlignCenter>
            <Button type="submit" variant="primary" onClick={handleClose}>
              Close
            </Button>
          </AlignCenter>
        ) : (
          <AlignCenter>
            <Button type="submit" variant="primary" onClick={() => (window.location.hash = '#')}>
              I will answer another time
            </Button>
          </AlignCenter>
        )}
      </Modal.Content>
    </CenteredModal>
  );
}

export default PopupModal;
