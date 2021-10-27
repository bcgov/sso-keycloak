import React, { createContext, useReducer, useMemo } from 'react';
import { isBoolean } from 'lodash';
import FadingAlert from 'html-components/FadingAlert';
import BottomAlertWrapper from 'components/BottomAlertWrapper';

const defaultContextValue = { state: '', dispatch: () => null } as any;
const BottomAlertContext = createContext(defaultContextValue);

interface ReducerState {
  show?: boolean;
  key?: string;
  variant?: string;
  faceOut?: boolean;
  closable?: boolean;
  content?: string;
}

interface Props {
  children?: React.ReactNode;
}

const reducer = (state: ReducerState, update: any) => {
  return { ...state, ...update };
};

export default function BottomAlertProvider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, {});

  const contextValue = useMemo(() => {
    return { state, dispatch };
  }, [state, dispatch]);

  return (
    <BottomAlertContext.Provider value={contextValue}>
      {children}
      {state.show && (
        <BottomAlertWrapper key={state.key}>
          <FadingAlert
            variant={state.variant || 'success'}
            fadeOut={state.fadeOut || 10000}
            closable={isBoolean(state.closable) ? state.closable : true}
            content={state.content || ``}
          />
        </BottomAlertWrapper>
      )}
    </BottomAlertContext.Provider>
  );
}

export const withBottomAlert = (Component: any) => (props: any) =>
  (
    <BottomAlertContext.Consumer>
      {({ state, dispatch }) => (
        <Component
          {...props}
          alert={{
            show: (payload: any) => dispatch({ ...payload, show: true, key: String(new Date().getTime()) }),
            hide: () => dispatch({ show: false }),
          }}
        >
          {props.children}
        </Component>
      )}
    </BottomAlertContext.Consumer>
  );

export interface BottomAlert {
  show: Function;
  hide: Function;
}
