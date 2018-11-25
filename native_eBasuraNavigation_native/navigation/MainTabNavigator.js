import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';

// import TabBarIcon from '../components/TabBarIcon';
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
    <Text>hello1</Text>
  ),
};

const PickupLocationsStack = createStackNavigator({
  PickupLocations: PickupLocationsScreen,
  PickupDetail: PickupDetailScreen
});

PickupLocationsStack.navigationOptions = {
  tabBarLabel: 'Pickups',
  tabBarIcon: ({ focused }) => (
    <Text>hello2</Text>
  ),
};

export default createBottomTabNavigator({
  MapNavigationStack,
  PickupLocationsStack,
});


{/* <TabBarIcon
      focused={focused}
      name={'map-search'}
    />
<TabBarIcon
      focused={focused}
      name={'map-marker-distance'}
    /> */}