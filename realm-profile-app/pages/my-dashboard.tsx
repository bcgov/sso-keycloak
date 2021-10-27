import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import StyledTable from 'html-components/Table';
import ResponsiveContainer, { MediaRule } from 'components/ResponsiveContainer';
import Button from '@button-inc/bcgov-theme/Button';
import { getRealmProfiles } from 'services/realm';
import { RealmProfile } from 'types/realm-profile';

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
    width: 480,
    marginTop: 0,
    marginLeft: 2.5,
    marginRight: 2.5,
    marginUnit: 'rem',
    horizontalAlign: 'none',
  },
];

function MyDashboard() {
  const router = useRouter();
  const [realms, setRealms] = useState<RealmProfile[]>([]);

  useEffect(() => {
    async function fetchRealms() {
      const [data, err] = await getRealmProfiles();
      if (!err) setRealms(data as RealmProfile[]);
    }

    fetchRealms();
  }, []);

  const handleEditClick = (id: string) => {
    router.push(`/realm/${id}`);
  };

  return (
    <ResponsiveContainer rules={mediaRules} style={{ textAlign: 'center' }}>
      <StyledTable>
        <thead>
          <tr>
            <th>Realm Name</th>
            <th>Description</th>
            <th>Product Name</th>
            <th>Openshift Namespace</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {realms.length > 0 ? (
            realms.map((realm) => {
              return (
                <tr key={realm.id}>
                  <td>{realm.realm}</td>
                  <td>{realm.description}</td>
                  <td>{realm.product_name}</td>
                  <td>{realm.openshift_namespace}</td>
                  <td>
                    <Button size="small" variant="secondary" onClick={() => handleEditClick(realm.id)}>
                      Edit
                    </Button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={10}>No realms found.</td>
            </tr>
          )}
        </tbody>
      </StyledTable>
    </ResponsiveContainer>
  );
}

export default MyDashboard;
