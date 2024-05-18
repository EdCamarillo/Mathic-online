import axios from "axios";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  // State to hold the authentication token
  const [token, setToken_] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  // Function to set the authentication token
  const setToken = (newToken) => {
    setToken_(newToken);
  };

  // Function to fetch the authenticated user's info
  const fetchUser = async () => {
    try {
      const response = await axios.get('http://localhost:8080/users/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user info', error);
      setUser(null);
    }
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = "Bearer " + token;
      localStorage.setItem('token', token);
      fetchUser();
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  // Memoized value of the authentication context
  const contextValue = useMemo(
    () => ({
      token,
      setToken,
      user,
    }),
    [token, user]
  );

  // Provide the authentication context to the children components
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthProvider;
