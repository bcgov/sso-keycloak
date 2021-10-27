import Link from 'next/link';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faEnvelope, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import Button from '@button-inc/bcgov-theme/Button';
import Footer from '@button-inc/bcgov-theme/Footer';
import styled from 'styled-components';
import { startCase } from 'lodash';
import BCSans from './BCSans';
import Navigation from './Navigation';
import BottomAlertProvider from './BottomAlert';

const headerPlusFooterHeight = '152px';

const LoggedUser = styled.span`
  font-weight: 600;
  font-size: 1.3em;
  display: flex;

  & .welcome {
    padding: 5px;
  }
`;

const MainContent = styled.div`
  padding: 1rem 0;
  min-height: calc(100vh - ${headerPlusFooterHeight});
`;

const MobileSubMenu = styled.ul`
  padding-left: 2rem;
  padding-right: 2rem;

  li a {
    display: inline-block !important;
    font-size: unset !important;
    padding: 0 !important;
    border-right: none !important;
  }
`;

const SubMenu = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding-left: 2rem;
  padding-right: 2rem;
`;

const SubLeftMenu = styled.ul`
  & a {
    font-size: 1rem !important;
  }

  & a.current {
    font-weight: bold;
  }

  & li.current {
    padding-bottom: 6px;
    border-bottom: none;
    background: linear-gradient(orange, orange) bottom /* left or right or else */ no-repeat;
    background-size: calc(100% - 2rem) 4px;
  }
`;

const SubRightMenu = styled.ul`
  padding-right: 2rem;
`;

const FooterMenu = styled.div`
  padding-left: 2rem;
  padding-right: 2rem;
`;

const HoverItem = styled.li`
  &:hover {
    opacity: 0.8;
  }
`;

const HeaderTitle = styled.div`
  margin-top: 15px;
`;

const Beta = styled.span`
  vertical-align: text-top;
  color: #fcba19;
  text-transform: uppercase;
  font-weight: 600;
  font-size: 16px;
`;

interface Route {
  path: string;
  label: string;
  hide?: boolean;
  roles: string[];
}

const routes: Route[] = [
  { path: '/', label: 'Home', roles: ['guest', 'user', 'sso-admin'] },
  { path: '/terms-conditions', label: 'Terms and Conditions', roles: ['guest'] },
  { path: '/my-dashboard', label: 'My Dashboard', roles: ['user', 'sso-admin'] },
  { path: '/realm', label: 'Realm Profile', roles: ['user'], hide: true },
];

const LeftMenuItems = ({ currentUser, currentPath }: { currentUser: any; currentPath: string }) => {
  let roles = ['guest'];

  if (currentUser) {
    roles = currentUser?.client_roles?.length > 0 ? currentUser.client_roles : ['user'];
  }

  const isCurrent = (path: string) => currentPath === path || currentPath.startsWith(`${path}/`);

  return (
    <>
      {routes
        .filter((route) => route.roles.some((role) => roles.includes(role)) && (!route.hide || isCurrent(route.path)))
        .map((route) => {
          return (
            <li key={route.path} className={isCurrent(route.path) ? 'current' : ''}>
              <Link href={route.path}>
                <a className={isCurrent(route.path) ? 'current' : ''}>{route.label}</a>
              </Link>
            </li>
          );
        })}
    </>
  );
};

const RightMenuItems = () => (
  <>
    <li>Need help?</li>
    <HoverItem>
      <a href="https://chat.developer.gov.bc.ca/channel/sso" target="_blank" title="Rocket Chat">
        <FontAwesomeIcon size="2x" icon={faCommentDots} />
      </a>
    </HoverItem>
    <HoverItem>
      <a href="mailto:bcgov.sso@gov.bc.ca" title="Pathfinder SSO">
        <FontAwesomeIcon size="2x" icon={faEnvelope} />
      </a>
    </HoverItem>
    <HoverItem>
      <a href="https://github.com/bcgov/ocp-sso/wiki" target="_blank" title="Documentation">
        <FontAwesomeIcon size="2x" icon={faFileAlt} />
      </a>
    </HoverItem>
  </>
);
// identity_provider, idir_userid, client_roles, family_name, given_name
function Layout({ children, currentUser, onLoginClick, onLogoutClick }: any) {
  const router = useRouter();
  const pathname = router.pathname;

  const rightSide = currentUser ? (
    <LoggedUser>
      <div className="welcome">Welcome {`${currentUser.given_name} ${currentUser.family_name}`}</div>
      &nbsp;&nbsp;
      <Button variant="secondary-inverse" size="medium" onClick={onLogoutClick}>
        Log out
      </Button>
    </LoggedUser>
  ) : (
    <Button variant="secondary-inverse" size="medium" onClick={onLoginClick}>
      Log in
    </Button>
  );

  const MobileMenu = () => (
    <MobileSubMenu>
      <LeftMenuItems currentUser={currentUser} currentPath={pathname} />

      <li>
        Need help?&nbsp;&nbsp;
        <a href="https://chat.developer.gov.bc.ca/" target="_blank" title="Rocket Chat">
          <FontAwesomeIcon size="2x" icon={faCommentDots} />
        </a>
        &nbsp;&nbsp;
        <a href="mailto:Vardhman.Shankar@gov.bc.ca" title="SSO Team">
          <FontAwesomeIcon size="2x" icon={faEnvelope} />
        </a>
        &nbsp;&nbsp;
        <a href="https://github.com/bcgov/ocp-sso/wiki" target="_blank" title="Wiki">
          <FontAwesomeIcon size="2x" icon={faFileAlt} />
        </a>
      </li>
      <li>
        {currentUser ? (
          <Button variant="secondary-inverse" size="small" onClick={onLogoutClick}>
            Logout
          </Button>
        ) : (
          <Button variant="secondary-inverse" size="small" onClick={onLoginClick}>
            Login with IDIR
          </Button>
        )}
      </li>
    </MobileSubMenu>
  );

  return (
    <>
      <BCSans />
      <Navigation
        title={() => (
          <HeaderTitle>
            My Keycloak Custom Realm App<Beta>Beta</Beta>
          </HeaderTitle>
        )}
        rightSide={rightSide}
        mobileMenu={MobileMenu}
        onBannerClick={console.log}
      >
        <SubMenu>
          <SubLeftMenu>
            <LeftMenuItems currentUser={currentUser} currentPath={pathname} />
          </SubLeftMenu>
          <SubRightMenu>
            <RightMenuItems />
          </SubRightMenu>
        </SubMenu>
      </Navigation>
      <MainContent><BottomAlertProvider>{children}</BottomAlertProvider></MainContent>
      <Footer>
        <FooterMenu>
          <ul>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <a href="https://www2.gov.bc.ca/gov/content/home/disclaimer" target="_blank" rel="noreferrer">
                Disclaimer
              </a>
            </li>
            <li>
              <a href="https://www2.gov.bc.ca/gov/content/home/privacy" target="_blank" rel="noreferrer">
                Privacy
              </a>
            </li>
            <li>
              <a href="https://www2.gov.bc.ca/gov/content/home/accessible-government" target="_blank" rel="noreferrer">
                Accessibility
              </a>
            </li>
            <li>
              <a href="https://www2.gov.bc.ca/gov/content/home/copyright" target="_blank" rel="noreferrer">
                Copyright
              </a>
            </li>
          </ul>
        </FooterMenu>
      </Footer>
    </>
  );
}
export default Layout;
