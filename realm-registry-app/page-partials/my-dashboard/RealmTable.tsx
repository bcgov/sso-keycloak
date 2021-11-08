import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Loader from 'react-loader-spinner';

import styled from 'styled-components';
import StyledTable from 'html-components/Table';
import ResponsiveContainer, { MediaRule } from 'components/ResponsiveContainer';
import CenteredModal from 'components/CenteredModal';
import Button from '@button-inc/bcgov-theme/Button';
import Modal from '@button-inc/bcgov-theme/Modal';
import Tabs from 'components/Tabs';
import RadioGroup from 'components/RadioGroup';
import { getRealmProfiles } from 'services/realm';
import { RealmProfile } from 'types/realm-profile';

interface Props {
  realms: RealmProfile[];
  // groupId: string;
  // options: RadioGroupOptions[];
  // direction: 'horizontal' | 'vertical';
  onEditClick: (id: string) => void;
  // style?: any;
}

function RealmTable({ realms, onEditClick }: Props) {
  return (
    <>
      <Tabs>
        <a href="javascript:void(0);" className="nav-link active">
          My Dashboard
        </a>
      </Tabs>
      <StyledTable>
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Openshift Namespace</th>
            <th>Product Owner</th>
            <th>Technical Owner</th>
            <th>Keycloak Realm Name</th>
            <th>IDPs Connected To</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {realms.length > 0 ? (
            realms.map((realm) => {
              return (
                <tr key={realm.id}>
                  <td>{realm.product_name}</td>
                  <td>{realm.openshift_namespace}</td>
                  <td>{realm.product_owner_name}</td>
                  <td>{realm.technical_contact_name}</td>
                  <td>{realm.realm}</td>
                  <td>{realm.idps?.join('/')}</td>
                  <td>
                    <Button size="small" variant="secondary" onClick={() => onEditClick(realm.id)}>
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
    </>
  );
}

export default RealmTable;
