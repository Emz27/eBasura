import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  AsyncStorage,
  Dimensions,
  StatusBar,
} from 'react-native';

import { MapView } from 'expo';


import { MonoText } from '../components/StyledText';

let { width, height } = Dimensions.get('window')
const ASPECT_RATIO = width / height
const LATITUDE_DELTA = 0.008
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

const DIRECTIONS_API_KEY = 'AIzaSyAKLNDKXRY5niSySOE8TIdz2yFgBmHyhjo';

export default class MapNavigationScreen extends React.Component {
  static navigationOptions = {
    header: null,
  }
  constructor(props){
    super(props);
    this.loadData();
    this.state = {
      user: {},
      truck: {},
      pickuplocations: [],
      route: {legs:[]}
    };

    this.coordinates = [];

  }
  onComponentDidMount(){
    
  }
  loadData = async ()=>{
    let user = JSON.parse(await AsyncStorage.getItem('eBasuraNavigationUser'));
    console.log('user loaded');
    let truck = JSON.parse(await AsyncStorage.getItem('eBasuraNavigationTruck'));
    console.log('truck loaded');
    let pickupLocations = JSON.parse(await AsyncStorage.getItem('eBasuraNavigationPickupLocations'));
    console.log('pickuplocations loaded');
    let origin = pickupLocations.filter( item => item.type=='origin').map( item => item.location._lat+','+item.location._long ).join();
    console.log(`origin : ${origin}`);
    let destination = origin;
    let waypoints = pickupLocations.filter( item => item.type=='waypoint').map( item => item.location._lat+','+item.location._long ).join('|');
    console.log(`waypoints : ${waypoints}`);
    let response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypoints}&key=${DIRECTIONS_API_KEY}`);
    let responseJson = await response.json();
    
    let route = responseJson.routes[0];

    this.coordinates = [];
    route.legs.forEach((leg)=>{
      leg.steps.forEach((step)=>{
        this.coordinates.push({latitude: step.start_location.lat, longitude: step.start_location.lng},{latitude: step.end_location.lat, longitude: step.end_location.lng})
      })
    })
    console.log(JSON.stringify(this.coordinates)+"hello coordinates");
    this.map.fitToCoordinates(this.coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
    this.setState({
      user: user,
      truck: truck,
      pickuplocations: pickupLocations,
      route: responseJson.routes[0]
    })
  }
  render() {

    let strokeColors = [];
    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor="blue"
          hidden = {true}
        />
        <MapView
          style={styles.map}
          ref={ref => { this.map = ref; }}
          initialRegion={{
            latitude: 14.61881,
            longitude: 121.057171,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}
          onLayout={()=>{
            
          }}
        >
            
            <MapView.Polyline 
              coordinates={this.coordinates}
              strokeColor="#000"
              strokeColors={strokeColors}
              strokeWidth={6}
            />
          {

            this.state.pickuplocations.map((pickup,index)=>{
              if(index == 0){
                return(
                  <MapView.Marker
                    key={pickup.key}
                    coordinate={{
                      latitude: pickup.location._lat,
                      longitude: pickup.location._long,
                    }}
                    title={pickup.pickupid}
                    description={(index+1).toString()}
                    pinColor="blue"
                  >
                  </MapView.Marker>
                )
              }
              else return(
                <MapView.Marker
                  key={pickup.key}
                  coordinate={{
                    latitude: pickup.location._lat,
                    longitude: pickup.location._long,
                  }}
                  title={pickup.pickupid}
                  description={(index+1).toString()}
                  onCalloutPress={()=>{
                    this.props.navigation.navigate('PickupDetail',{pickup:pickup});
                  }}
                >
                </MapView.Marker>
              )
              
            })
          }
        </MapView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map:{
    flex:1,
  }
});
