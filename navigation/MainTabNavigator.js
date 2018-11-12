import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';

import TabBarIcon from '../components/TabBarIcon';
import MapNavigationScreen from '../screens/MapNavigationScreen';
import PickupLocationsScreen from '../screens/PickupLocationsScreen';
import PickupDetailScreen from '../screens/PickupDetailScreen';

const MapNavigationStack = createStackNavigator({
  MapNavigation: MapNavigationScreen,
  PickupDetail: PickupDetailScreen,
});

MapNavigationStack.navigationOptions = {
  tabBarLabel: 'Navigation',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={'map-search'}
    />
  ),
};

const PickupLocationsStack = createStackNavigator({
  PickupLocations: PickupLocationsScreen,
  PickupDetail: PickupDetailScreen
});

PickupLocationsStack.navigationOptions = {
  tabBarLabel: 'Pickups',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={'map-marker-distance'}
    />
  ),
};

export default createBottomTabNavigator({
  MapNavigationStack,
  PickupLocationsStack,
});
