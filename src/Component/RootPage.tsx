import { DEFAULT_COOKIE_GETTER } from '../helper/Cookie';
import React, { useEffect, useState } from 'react';
import Login from './Login/LoginInfo';
import DashBoard from './Dashboard/Dashboard';
import { Provider } from 'react-redux';

import rootStore from '../redux/store';

import { useNavigate } from 'react-router-dom';

const RootPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const access_object = await DEFAULT_COOKIE_GETTER("access_token");

      if (access_object) {
        setAccessToken(access_object);
        navigate("/dashboard");
      } else {
        setAccessToken(null);
      }

      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return null; 
  }

  return (

    
<>
      {accessToken ? <DashBoard /> : <Login />}
      </>

  );
};

export default RootPage;
