import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import ResponsiveContainer, { MediaRule } from 'components/ResponsiveContainer';
import Button from '@button-inc/bcgov-theme/Button';
import { withBottomAlert, BottomAlert } from 'layout/BottomAlert';
import { getRealmProfile, updateRealmProfile } from 'services/realm';
import { UserSession } from 'types/user-session';
import styled from 'styled-components';
import { RealmProfile } from 'types/realm-profile';

const Container = styled.div`
  font-size: 1rem;
  padding: 0 0.5rem 0 0.5rem;

  label {
    display: block;
    margin-bottom: 0.2777em;
    .required {
      color: red;
    }
    font-weight: 700;
    font-size: 0.8rem;
  }
  input {
    display: block;
    border: 2px solid #606060;
    border-radius: 0;
    padding: 0.5em 0.6em;
    border-radius: 0.25em;
    margin-bottom: 1rem;
    width: 100%;

    &:focus {
      outline: 4px solid #3b99fc;
      outline-offset: 1px;
    }

    &:disabled {
      background: #dddddd;
    }
  }
`;

interface Props {
  alert: BottomAlert;
  realm: RealmProfile;
  currentUser: UserSession;
  onUpdate: (realm: RealmProfile) => void;
  onCancel: () => void;
}

function RealmTable({ alert, realm, currentUser, onUpdate, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const updateRealm = (realm: RealmProfile) => {
    const keys = Object.keys(realm);
    for (let x = 0; x < keys.length; x++) {
      const key = keys[x];
      setValue(key, realm[key]);
    }
  };

  useEffect(() => {
    updateRealm(realm);
  }, [realm]);

  const onSubmit = async (formData: RealmProfile) => {
    const [data, err] = await updateRealmProfile(realm.id, formData);
    if (!err) {
      onUpdate(data as RealmProfile);

      alert.show({
        variant: 'success',
        fadeOut: 2500,
        closable: true,
        content: 'Realm profile hass been updated successfully',
      });
    }
  };

  const isPO = currentUser.idir_userid === realm.product_owner_idir_userid;

  return (
    <Container>
      <h2>Realm Name: {realm.realm}</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor="displayName">Realm Descriptive Name</label>
        <input
          type="text"
          placeholder="Realm Descriptive Name"
          disabled
          {...register('displayName', { required: false, minLength: 2, maxLength: 1000 })}
        />
        <label htmlFor="product_name">
          Product Name<span className="required">*</span>
        </label>
        <input
          type="text"
          placeholder="Product Name"
          {...register('product_name', { required: false, minLength: 2, maxLength: 1000 })}
        />
        <label htmlFor="openshift_namespace">
          Openshift Namespace<span className="required">*</span>
        </label>
        <input
          type="text"
          placeholder="Openshift Namespace"
          {...register('openshift_namespace', { required: false, minLength: 2, maxLength: 1000 })}
        />
        <label htmlFor="product_owner_email">
          Product Owner Email<span className="required">*</span>
        </label>
        <input
          type="text"
          placeholder="Product Owner Email"
          disabled={!isPO}
          {...register('product_owner_email', { required: false, pattern: /^\S+@\S+$/i })}
        />
        <label htmlFor="product_owner_idir_userid">Product Owner Idir</label>
        <input
          type="text"
          placeholder="Product Owner Idir"
          disabled
          {...register('product_owner_idir_userid', { required: false, minLength: 2, maxLength: 1000 })}
        />
        <label htmlFor="technical_contact_email">
          Technical Contact Email<span className="required">*</span>
        </label>
        <input
          type="text"
          placeholder="Technical Contact Email"
          {...register('technical_contact_email', { required: false, pattern: /^\S+@\S+$/i })}
        />
        <label htmlFor="technical_contact_idir_userid">Technical Contact Idir</label>
        <input
          type="text"
          placeholder="Technical Contact Idir"
          disabled={!isPO}
          {...register('technical_contact_idir_userid', { required: false, minLength: 2, maxLength: 1000 })}
        />
        {realm && <p>Last Updated: {new Date(realm.updated_at).toLocaleString()}</p>}
        <Button type="submit" variant="primary">
          Save
        </Button>
        &nbsp;
        <Button type="button" variant="primary-inverse" onClick={onCancel}>
          Cancel
        </Button>
      </form>
    </Container>
  );
}

export default withBottomAlert(RealmTable);
