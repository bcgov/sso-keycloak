import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Loader from 'react-loader-spinner';
import styled from 'styled-components';
import Button from '@button-inc/bcgov-theme/Button';
import Modal from '@button-inc/bcgov-theme/Modal';
import Grid from '@button-inc/bcgov-theme/Grid';
import Alert from '@button-inc/bcgov-theme/Alert';
import StyledLink from '@button-inc/bcgov-theme/Link';
import { RealmProfile } from 'types/realm-profile';
import { UserSession } from 'types/user-session';
import RealmTable from 'page-partials/my-dashboard/RealmTable';
import RealmEdit from 'page-partials/my-dashboard/RealmEdit';
import PopupModal from 'page-partials/my-dashboard/PopupModal';
import TopAlertWrapper from 'components/TopAlertWrapper';
import ResponsiveContainer, { MediaRule } from 'components/ResponsiveContainer';
import { getRealmProfiles } from 'services/realm';
import { getSurvey, answerSurvey } from 'services/survey';

const AlignCenter = styled.div`
  text-align: center;
`;

const mediaRules: MediaRule[] = [
  {
    maxWidth: 900,
    marginTop: 0,
    marginLeft: 10,
    marginRight: 10,
    marginUnit: 'px',
    horizontalAlign: 'none',
  },
  {
    marginTop: 15,
    marginLeft: 2.5,
    marginRight: 2.5,
    marginUnit: 'rem',
    horizontalAlign: 'none',
  },
];

interface Props {
  currentUser: UserSession;
}

function MyDashboard({ currentUser }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [answered, setAnswered] = useState<boolean>(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [realms, setRealms] = useState<RealmProfile[]>([]);

  useEffect(() => {
    async function fetchSurvey() {
      const [data, err] = await getSurvey();
      if (err) {
        setHasError(true);
      } else {
        setAnswered(!!data);
      }
    }

    async function fetchData() {
      setLoading(true);
      const [data, err] = await getRealmProfiles();
      if (err) {
        setHasError(true);
      } else {
        setRealms(data as RealmProfile[]);
      }
      setLoading(false);
    }

    fetchSurvey();
    fetchData();
  }, []);

  const handleEditClick = (id: string) => {
    // router.push(`/realm/${id}`);
    setSelectedId(id);
  };

  const handleUpdate = (realm: RealmProfile) => {
    const newList = realms.map((currRealm) => {
      // let's keep the derived fields from the list
      if (currRealm.id === realm.id) return { ...currRealm, ...realm };
      else return currRealm;
    });

    setRealms(newList);
  };

  const handleAnswer = (value: boolean) => {
    setAnswered(value);
  };

  const handleCancel = () => {
    setSelectedId(null);
  };

  if (hasError) return null;

  return (
    <>
      {!answered && (
        <TopAlertWrapper>
          <Alert variant="warning" closable={true}>
            Would you like to migrate to a standard realm? Find out more{' '}
            <StyledLink href="/my-dashboard#realm-migration" content="here" />
          </Alert>
        </TopAlertWrapper>
      )}
      <ResponsiveContainer rules={mediaRules}>
        {loading ? (
          <AlignCenter>
            <Loader type="Grid" color="#000" height={45} width={45} visible={loading} />
          </AlignCenter>
        ) : (
          <Grid cols={10} style={{ overflowX: 'hidden' }}>
            <Grid.Row collapse="800" gutter={[15, 2]}>
              <Grid.Col span={selectedId ? 6 : 10} style={{ overflowX: 'auto' }}>
                <RealmTable realms={realms} onEditClick={handleEditClick}></RealmTable>
              </Grid.Col>
              {selectedId && (
                <Grid.Col span={4}>
                  <RealmEdit
                    realm={realms.find((v) => v.id === selectedId)}
                    currentUser={currentUser}
                    onUpdate={handleUpdate}
                    onCancel={handleCancel}
                  />
                </Grid.Col>
              )}
            </Grid.Row>
          </Grid>
        )}
        <PopupModal open={!answered} onAnswer={handleAnswer} />
      </ResponsiveContainer>
    </>
  );
}

export default MyDashboard;
