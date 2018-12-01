
import React from 'react';
import {
  StyleSheet,
  View,
  AsyncStorage,
  Dimensions,
  StatusBar,
  TouchableNativeFeedback,
  Alert,
  FlatList,
  Text,
} from 'react-native';

import MapView from 'react-native-maps'
import {Marker, Polyline} from 'react-native-maps'

import Svg, {Circle,Text as SText,TSpan} from 'react-native-svg';

import Colors from './../constants/Colors.js';

import polyline from 'google-polyline';

const dumpsiteLocation = {
  latitude: 14.7181,
  longitude: 121.1042,
}
const GOOGLE_API_KEY = 'AIzaSyAKLNDKXRY5niSySOE8TIdz2yFgBmHyhjo';


let { width, height } = Dimensions.get('window')
const ASPECT_RATIO = width / height
const LATITUDE_DELTA = 0.008
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
};

createPickupMarker = ({collections, isShowNumber, textColor, fillColor, borderColor })=>{
  return collections.map((pickup,index)=>{
    return(
      <Marker
        flat={true}
        key={pickup.key}
        coordinate={{
          latitude: pickup.location.latitude,
          longitude: pickup.location.longitude,
        }}
        description={pickup.address}
        onCalloutPress={()=>{
          this.props.navigation.navigate('PickupDetail',{pickup:pickup});
        }}
      >
        <View
          style={{
            height: 25,
            width: 25,
            borderRadius: 25,
            backgroundColor: fillColor,
            borderWidth: 5,
            borderColor: borderColor,
            justifyContent:"center",
            alignItems:"center",
          }}>
          {
            (isShowNumber)
            ?<Text
              style={{color: textColor, fontSize: 9}}>
              {index+1}
            </Text>
            :<View></View>
          }
        </View>
      </Marker>
    )
  })
}


export default class MapNavigationScreen extends React.Component {
  static navigationOptions = {
    header: null,
  }
  constructor(props){
    super(props);
    console.log("MapNavigationScreen Start");
    
    this.state = {
      collectionsHistory:[],
      collectionsToday: [],
      pendingCollections: [],
      skippedCollections: [],
      collectedCollections: [],
      route: {legs:[]},
      paths: [],
    };
    
  }
  async handleReRoutePress(pendingCollections){
    var pendingCollections = [...pendingCollections];
    var destination = dumpsiteLocation;
    var waypoints = pendingCollections.map( item => { return {latitude: item.location.latitude, longitude: item.location.longitude}} );
    var route = await this.getDirection(destination, waypoints);
    var paths = [];
    if( route != false ){
      console.log("Retrieved atleast one route", route);
      // arrange 
      pendingCollections = route.waypoint_order.map((item, index)=>{
        return pendingCollections[item];
      })
      paths = this.generatePaths(route);
    }
    this.setState({ pendingCollections, paths },()=>{
      this.map.fitToCoordinates(paths, {
        edgePadding: { top: 10, right: 10, bottom: 10, left: 10 },
        animated: true,
      });
    });
  }
  generatePaths(route){
    var paths = []
    route.legs.forEach((leg)=>{
      leg.steps.forEach((step)=>{
        decodedPolyline = polyline.decode(step.polyline.points );
        decodedPolyline.forEach((item)=>{
          paths = [...paths, { latitude: item[0], longitude: item[1] }];
        })
      })
    })
    return paths;
  }
  async getDirection( destinationLatLng, waypointsLatLng){
    console.log("google api get directions start");
    let pos = {
      coords: {
        latitude: 14.61881,
        longitude: 121.057171,
      }
    }
    console.log("geolocation start");
    try{
      pos = await getCurrentPosition();
    }
    catch(e){
      console.log("Fail to get device location ", e)
    }
    var origin = pos.coords.latitude+","+pos.coords.longitude;
    var destination = destinationLatLng.latitude+","+destinationLatLng.longitude;
    var waypoints = waypointsLatLng.map( item => item.latitude+','+item.longitude ).join('|');
    let route = {};
    let response = {};
    let responseJson = {};
    try{
      response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypoints}&key=${GOOGLE_API_KEY}`);
      responseJson = await response.json();
      if(responseJson.status == "OK"){
        route = responseJson.routes[0];
        return route;
      } 
    }
    catch(e){
      console.log("Get directions failed", e);
    }
    console.log("Get directions finished", responseJson);
    return false;
  }
  async loadData(){
    console.log("Load Data start");
    try{
      this.user = JSON.parse(await AsyncStorage.getItem('user'));
      //let collections = JSON.parse(await AsyncStorage.getItem("collections"));
      let collectionsToday = JSON.parse(await AsyncStorage.getItem("collectionsToday"));
      let collectionsHistory = JSON.parse(await AsyncStorage.getItem("collectionsHistory"));
      let pendingCollections = JSON.parse(await AsyncStorage.getItem("pendingCollections"));
      let collectedCollections = JSON.parse(await AsyncStorage.getItem("collectedCollections"));
      let skippedCollections = JSON.parse(await AsyncStorage.getItem("skippedCollections"));

      let route = JSON.parse(await AsyncStorage.getItem("route"));
      let paths = JSON.parse(await AsyncStorage.getItem("paths"));
      this.map.fitToCoordinates(paths, {
        edgePadding: { top: 10, right: 10, bottom: 10, left: 10 },
        animated: true,
      });
      this.setState({
        collectionsToday,
        collectionsHistory,
        pendingCollections,
        collectedCollections,
        skippedCollections,
        route: route,
        paths: paths,
      })
    }
    catch(e){
      console.log("Load data failed", e);
    }
    console.log("Load Data end");
  }
  render() {
    var initialRegion = {
      latitude: 14.61881,
      longitude: 121.057171,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    };
    let strokeColors = [];

    var pendingCollectionsMarker = createPickupMarker({
      collections: this.state.pendingCollections, 
      isShowNumber: true, 
      textColor: "white", 
      fillColor: Colors.red, 
      borderColor: Colors.purple,
    });
    var collectedCollectionsMarker = createPickupMarker({
      collections: this.state.collectedCollections, 
      isShowNumber: false, 
      textColor: "white", 
      fillColor: Colors.red, 
      borderColor: Colors.purple,
    });
    var skippedCollectionsMarker = createPickupMarker({
      collections: this.state.skippedCollections, 
      isShowNumber: false, 
      textColor: "white", 
      fillColor: Colors.red, 
      borderColor: Colors.purple,
    });

    return (
      <View style={styles.container}>
        <View style={styles.reRoute}>
          <TouchableNativeFeedback
            onPressIn={()=>this.handleReRoutePress(this.state.pendingCollections)}
            background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
          >
          <View
            style={[{
              height:150,
              width:150,
              justifyContent:"center",
              marginLeft: 20,
              flex:1,
            }]}
          ><Text style={{color:"white"}}>reroute</Text></View>
          </TouchableNativeFeedback>
        </View>
        <MapView
          style={styles.map}
          ref={ref => { this.map = ref; }}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          onLayout={async ()=>{
            await this.loadData();
          }}
        >
            <Polyline 
              coordinates={this.state.paths}
              strokeColor={Colors.purpleLight}
              strokeColors={strokeColors}
              strokeWidth={6}
              miterLimit={50}
            />
          { pendingCollectionsMarker }
          { collectedCollectionsMarker }
          { skippedCollectionsMarker }
        </MapView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40,
    marginBottom: 40,
    backgroundColor: '#fff',
  },
  map:{
    flex:1,
  },
  reRoute:{
    position: "absolute",
    top: 20,
    right : -50,
    height: 50,
    width: 120,
    borderTopStartRadius:50,
    borderBottomStartRadius: 50,
    zIndex: 5000,
    backgroundColor: Colors.purple,
    elevation: 5,
  }
  
});
