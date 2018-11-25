import React from 'react';
import { createSwitchNavigator, createAppContainer } from 'react-navigation';

import MainTabNavigator from './MainTabNavigator';
import AuthLoadingScreen from '../screens/AuthLoadingScreen';
import SignInScreen from '../screens/SignInScreen';

var Switch = createSwitchNavigator({
  // You could add another route here for authentication.
  // Read more at https://reactnavigation.org/docs/en/auth-flow.html
  Main: MainTabNavigator,
  AuthLoading: AuthLoadingScreen,
  SignIn: SignInScreen,
},
{
  initialRouteName: 'AuthLoading',
});

export default createAppContainer(Switch);