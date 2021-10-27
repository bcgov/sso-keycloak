import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import ResponsiveContainer, { MediaRule } from 'components/ResponsiveContainer';
import Button from '@button-inc/bcgov-theme/Button';
import { withBottomAlert, BottomAlert } from 'layout/BottomAlert';
import { getRealmProfile, updateRealmProfile } from 'services/realm';
import { RealmProfile } from 'types/realm-profile';
import styled from 'styled-components';

const Container = styled(ResponsiveContainer)`
  font-size: 1rem;
  padding: 0.5rem;

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

const mediaRules: MediaRule[] = [
  {
    maxWidth: 767,
    marginTop: 10,
  },
  {
    maxWidth: 800,
    width: 680,
    marginTop: 10,
  },
  {
    width: 850,
    marginTop: 10,
  },
];

interface Props {
  alert: BottomAlert;
}

function EditRealm({ alert }: Props) {
  const router = useRouter();
  const { rid } = router.query;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  const [realm, setRealm] = useState<RealmProfile | null>(null);

  const updateRealm = (realm: RealmProfile) => {
    setRealm(realm);
    const keys = Object.keys(realm);
    for (let x = 0; x < keys.length; x++) {
      const key = keys[x];
      setValue(key, realm[key]);
    }
  };

  const onSubmit = async (formData: RealmProfile) => {
    const [data, err] = await updateRealmProfile(rid as string, formData);
    if (!err) {
      updateRealm(data as RealmProfile);

      alert.show({
        variant: 'success',
        fadeOut: 2500,
        closable: true,
        content: 'Realm profile hass been updated successfully',
      });
    }
  };

  useEffect(() => {
    async function fetchRealm() {
      if (!rid) return;

      const [data, err] = await getRealmProfile(rid as string);
      if (!err) {
        updateRealm(data as RealmProfile);
      }
    }

    fetchRealm();
  }, [rid]);

  return (
    <Container rules={mediaRules}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor="realm">Realm Name</label>
        <input
          id="realm"
          type="text"
          placeholder="Realm Name"
          disabled
          {...register('realm', { required: true, maxLength: 1000 })}
        />

        <label htmlFor="description">
          Description<span className="required">*</span>
        </label>
        <input
          type="text"
          placeholder="Description"
          {...register('description', { required: false, minLength: 2, maxLength: 1000 })}
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
          disabled
          {...register('technical_contact_idir_userid', { required: false, minLength: 2, maxLength: 1000 })}
        />
        {realm && <p>Last Updated: {new Date(realm.updated_at).toLocaleString()}</p>}

        <Button type="submit" variant="primary">
          Save
        </Button>
      </form>
    </Container>
  );
}

export default withBottomAlert(EditRealm);
