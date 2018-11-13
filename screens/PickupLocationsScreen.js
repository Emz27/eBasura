import React from 'react';
import { DrawerLayoutAndroid, Button, TouchableWithoutFeedback, Text, View, AsyncStorage, FlatList, StyleSheet, Animated, Dimensions } from 'react-native'
import { MapView } from 'expo'
import { ExpoConfigView } from '@expo/samples';


import * as firebase from 'firebase';
import 'firebase/firestore';


let { width: windowX } = Dimensions.get('window')

let { width, height } = Dimensions.get('window')
const ASPECT_RATIO = width / height
const LATITUDE_DELTA = 0.008
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

export default class PickupLocationsScreen extends React.Component {
  constructor(props){
    super(props);
    this.loadPickupLocations();
    this.loadUser();
    this.state = {
      user:{},
      pickuplocations:[],
    }
    
  }
  static navigationOptions = {
    header: null,
  }
  onPressSignOut = async () =>{
    await AsyncStorage.removeItem('eBasuraNavigationUser');
    this.props.navigation.navigate('AuthLoading');
  }
  componentDidMount(){

  }
  loadPickupLocations = async ()=>{
    var pickupLocations = JSON.parse(await AsyncStorage.getItem('eBasuraNavigationPickupLocations'))
    pickupLocations = pickupLocations.map((pickup)=>{
      pickup.itemWidthMax = 0;
      pickup.itemWidthMin = (-1)*windowX*.8;

      pickup.isLarge = false;
      pickup.itemWidth = new Animated.Value( pickup.itemWidthMin );
      pickup.itemHeight = new Animated.Value( pickup.itemHeightMin );

      return pickup;
    });
    this.setState({
      pickuplocations: pickupLocations
    })

    console.log('Pickup Locations Loaded');
  }
  loadUser = async ()=>{
    this.setState({
      user: JSON.parse(await AsyncStorage.getItem('eBasuraNavigationUser'))
    })
    console.log('User Loaded');
  }
  render() {
    /* Go ahead and delete ExpoConfigView and replace it with your
     * content, we just wanted to give you a quick view of your config */
    return (
      <View style={styles.container}>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 14.61881,
              longitude: 121.057171,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
          }}>

          </MapView>
        </View>

        <FlatList contentContainerStyle={styles.listContainer}
          data={this.state.pickuplocations}
          renderItem={({item}) => <View></View>
          }
        />

      </View>
    );
  }
}


const styles = StyleSheet.create({
  container:{
    flex:1
  },
  mapContainer:{
    flex:1
  },
  map:{
    flex:1
  },
  listContainer :{
    flex:3,
  },
  listItem:{
    backgroundColor: "#02ffe5",
    padding: 2,
    flexDirection:"row",

    borderBottomEndRadius:5,
    borderTopEndRadius:5,
    marginTop:5,
    elevation: 10,
    width: windowX*.9,
    overflow:"hidden",
    position:"relative",
  }
});