import React from 'react';
import { createSwitchNavigator, createStackNavigator, createAppContainer } from 'react-navigation';

import PickupMapScreen from './../screens/PickupMap.js'
import PickupDetailScreen from './../screens/PickupDetail.js'
import AuthLoadingScreen from './../screens/AuthLoading.js'


const MainStack = createStackNavigator({
  PickupMap: PickupMapScreen,
  PickupDetail: PickupDetailScreen,
});

var Switch = createSwitchNavigator({
  Main: MainStack,
  AuthLoading: AuthLoadingScreen,
},
{
  initialRouteName: 'AuthLoading',
});

export default createAppContainer(Switch);