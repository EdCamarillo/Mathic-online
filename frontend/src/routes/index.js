import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { useAuth } from "../authentication/AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";
import Login from "../components/Login";
import Home from "../components/Home";
import Signup from "../components/Signup";
import Room from "../components/Room";
import Game from "../components/Game";

const Routes = () => {
  const { token } = useAuth();

  // Define public routes accessible to all users
  const routesForPublic = [
    {
      path: "/about-us",
      element: <div>About Us</div>,
    },
    {
      path: "/login",
      element: <Login/>,
    },
  ];

  // Define routes accessible only to authenticated users
  const routesForAuthenticatedOnly = [
    {
      path: "/",
      element: <ProtectedRoute />, // Wrap the component in ProtectedRoute
      children: [
        {
          path: "home",
          element: <Home />,
        },
        {
          path: "room/:gameId", // Add the Room route
          element: <Room />,
        },
        {
          path: "game/:gameId",
          element: <Game />
        }
      ],
    },
  ];

  // Define routes accessible only to non-authenticated users
  const routesForNotAuthenticatedOnly = [
    {
      path: "/signup",
      element: <Signup/>,
    },
  ];

  // Combine and conditionally include routes based on authentication status
  const router = createBrowserRouter([
    ...routesForPublic,
    ...(!token ? routesForNotAuthenticatedOnly : []),
    ...routesForAuthenticatedOnly,
  ]);

  // Provide the router configuration using RouterProvider
  return <RouterProvider router={router} />;
};

export default Routes;