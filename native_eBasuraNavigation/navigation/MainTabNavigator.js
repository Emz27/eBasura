import React from 'react';
import { Platform, Text } from 'react-native';
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
  tabBarVisible: false,
  header: null,
};

const PickupLocationsStack = createStackNavigator({
  PickupLocations: PickupLocationsScreen,
  PickupDetail: PickupDetailScreen
});

PickupLocationsStack.navigationOptions = {
  tabBarVisible: false,
  header: null,
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