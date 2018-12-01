
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

const METERS_TO_NOTIFY = 20;
const METERS_TO_REACH = 20;
const PATH_DIVISION_RATIO = 3

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
var rad = function(x) {
  return x * Math.PI / 180;
};

var getDistance = function(p1, p2) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2.latitude - p1.latitude);
  var dLong = rad(p2.longitude - p1.longitude);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.latitude)) * Math.cos(rad(p2.latitude)) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};

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
      pickupPaths: [],
      isMockLocation: true,
      isReachedPickup: false,
      isNotified: false,
      currentLocation: {
        latitude:"",
        longitude: "",
      },
      pickupLocation: {
        latitude:"",
        longitude: "",
      },
      notificationLocation: {
        latitude:"",
        longitude: "",
      }
    };
    
  }
  async handleReRoutePress(pendingCollections){
    var pendingCollections = [...pendingCollections];
    var destination = dumpsiteLocation;
    var waypoints = pendingCollections.map( item => { return {latitude: item.location.latitude, longitude: item.location.longitude}} );
    var route = await this.getDirection( destination, waypoints);
    var paths = [];
    var pickupPaths = [];
    var pickupLocation = {};
    var notificationLocation = {};
    if( route != false ){
      console.log("Retrieved atleast one route", route);
      // arrange 
      pendingCollections = route.waypoint_order.map((item, index)=>{
        return pendingCollections[item];
      })
      var r = this.generatePaths(route);
      paths = r.paths;
      pickupPaths = r.pickupPaths;
      let targetLocation = this.getTargetLocation(pickupPaths);
      pickupLocation = targetLocation.pickupLocation;
      notificationLocation = targetLocation.notificationLocation;
    }
    this.setState({ 
      pendingCollections, 
      paths, 
      pickupPaths,
      pickupLocation,
      notificationLocation
    },
    ()=>{
      this.map.fitToCoordinates(paths, {
        edgePadding: { top: 10, right: 10, bottom: 10, left: 10 },
        animated: true,
      });
    });
  }
  generatePaths(route){
    var paths = [];
    var pickupPaths = [];
    route.legs.forEach((leg)=>{
      let legPoints = [];
      leg.steps.forEach((step)=>{
        decodedPolyline = polyline.decode(step.polyline.points );
        let stepPoints = [];
        decodedPolyline.forEach((item)=>{
          stepPoints = [...stepPoints, { latitude: item[0], longitude: item[1] }];
        })
        legPoints = [...legPoints, ...stepPoints];
      });
      paths = [...paths, ...legPoints];
      pickupPaths.push(legPoints);
    })
    return {pickupPaths, paths};
  }
  async getDirection( destinationLatLng, waypointsLatLng){
    console.log("google api get directions start");
    let pos = {
      coords: {
        latitude: 14.61881,
        longitude: 121.057171,
      }
    }
    if(this.state.isMockLocation && this.state.currentLocation.latitude != ""){
      pos.coords.latitude = this.state.currentLocation.latitude;
      pos.coords.longitude = this.state.currentLocation.longitude;
    }
    else{
      console.log("geolocation start");
      try{
        pos = await getCurrentPosition();
      }
      catch(e){
        console.log("Fail to get device location ", e)
      }
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
  getTargetLocation(pickupPaths){
    let pickupLocation = {};
    let notificationLocation = {};
    try{
      let firstPath = pickupPaths[0];
      let count = firstPath.length;
      let notificationIndex = (count) - Math.round(count / PATH_DIVISION_RATIO);
      pickupLocation = firstPath[count-1];
      notificationLocation = firstPath[notificationIndex]; 
    }
    catch(e){
      console.log(e);
    }
    return {pickupLocation, notificationLocation};
  }
  async setCollectorPosition(collectorPos){
    let state = {
      currentLocation: collectorPos,
    }
    if( !this.state.isReachedPickup && !this.state.isNotified && getDistance(collectorPos, this.state.notificationLocation) < METERS_TO_NOTIFY ){
      //state.isNotified = true;
      var result = false;
      try{
        var origin = collectorPos.latitude+","+collectorPos.longitude;
        var destination = this.state.pickupLocation.latitude + "," + this.state.pickupLocation.longitude;
        result = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${origin}&destinations=${destination}&key=${GOOGLE_API_KEY}`);
        result = await result.json();
        console.log("notify");
      }catch(e){ console.log(e) }
    }
    else if( !this.state.isReachedPickup && getDistance(collectorPos, this.state.pickupLocation) < METERS_TO_REACH ){
      //state.isReachedPickup = true;
      console.log("reached")
    }
    this.setState(state);
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
      let pickupPaths = JSON.parse(await AsyncStorage.getItem("pickupPaths"));
      this.map.fitToCoordinates(paths, {
        edgePadding: { top: 10, right: 10, bottom: 10, left: 10 },
        animated: true,
      });
      let targetLocation = this.getTargetLocation(pickupPaths);
      let pickupLocation = targetLocation.pickupLocation;
      let notificationLocation = targetLocation.notificationLocation;
      this.setState({
        collectionsToday,
        collectionsHistory,
        pendingCollections,
        collectedCollections,
        skippedCollections,
        route,
        paths,
        pickupPaths,
        pickupLocation,
        notificationLocation,
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
    var notificationMarker = ()=>{
      if( this.state.notificationLocation.latitude != ""){
        return (
          <Marker
            flat={false}
            coordinate={{
              latitude: this.state.notificationLocation.latitude,
              longitude: this.state.notificationLocation.longitude,
            }}
          />
        )
      }
      return null;
    }
    var collectorMarker = () =>{
      if( this.state.isMockLocation && this.state.currentLocation.latitude != "" ){
        return (
          <Marker
            flat={false}
            coordinate={{
              latitude: this.state.currentLocation.latitude,
              longitude: this.state.currentLocation.longitude,
            }}
          />
        )
      }
      return null;
    }

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
          onPress={(event)=>{
            if(this.state.isMockLocation){
              this.setCollectorPosition(event.nativeEvent.coordinate);
            }
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
          { notificationMarker() }
          { collectorMarker() }
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
