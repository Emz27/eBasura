
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
  ActivityIndicator,
  Animated,
  Button,
} from 'react-native';

import MapView, { Callout } from 'react-native-maps'
import {Marker, Polyline} from 'react-native-maps'

import Svg, {Circle,Text as SText,TSpan} from 'react-native-svg';

import Colors from './../constants/Colors.js';

import polyline from 'google-polyline';
import firebase from 'react-native-firebase';

import Ionicons from 'react-native-vector-icons/Ionicons';

const CheckIcon = (<Ionicons name="ios-checkmark" size={20} color={Colors.purple} />)

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
const emptyCoord = { latitude: "", longitude: ""}
const emptyPickup = { key: "" }
getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
};


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
      isReachedAlert: false,
      isAlertLoading: false,
      isPickupLoading: false,

      currentLocation: emptyCoord,
      currentPickup: emptyPickup,
      pickupLocation: emptyCoord,
      alertLocation: emptyCoord,
      originLocation: emptyCoord,
      destinationLocation: emptyCoord,

      selectedPickup: emptyPickup,
      isPickupInfoOpen: false,
    };
    this.pickupInfoTranslateY = new Animated.Value(-300);
  }
  async reRoute(pendingCollections){
    var pendingCollections = [...pendingCollections];
    var destination = dumpsiteLocation;
    var waypoints = pendingCollections.map( item => { return {latitude: item.location.latitude, longitude: item.location.longitude}} );
    var route = await this.getDirection( destination, waypoints);
    var paths = [];
    var pickupPaths = [];
    var pickupLocation = {};
    var alertLocation = {};
    let originLocation = this.state.currentLocation;
    let destinationLocation = dumpsiteLocation;
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
      alertLocation = targetLocation.alertLocation;
    }
    let currentPickup = pendingCollections[0];
    this.setState({ 
      pendingCollections, 
      paths, 
      pickupPaths,
      pickupLocation,
      alertLocation,
      originLocation,
      destinationLocation,
      currentPickup,
      isReachedPickup: false,
      isReachedAlert: false,
      isAlertLoading: false,
      isPickupLoading: false,
    },
    ()=>{
      this.map.fitToCoordinates(paths, {
        edgePadding: { top: 10, right: 10, bottom: 10, left: 10 },
        animated: true,
      });
    });
  }
  createPickupMarker = (type)=>{
    var pending = {
      collection: this.state.pendingCollections
    };
    var collected = {
      collection: this.state.collectedCollections
    };
    var skipped = {
      collection: this.state.skippedCollections
    };
    var pickupType = {};
  
    if(type == "pending") pickupType = pending;
    else if(type == "collected") pickupType = collected;
    else if(type == "skipped") pickupType = skipped;
    
    return pickupType.collection.map((pickup,index)=>{
      var content = null;
      var style = {fontSize: 8, fontWeight: "bold"}
      var isPickupLoading = this.state.isPickupLoading;
      var tracksViewChanges = false;
      if(type == "pending"){
        content = <Text style={style}>{index+1}</Text>;
        if( isPickupLoading && index == 0){
          content = <ActivityIndicator size="small" style={{transform:[{scale: .5}]}} ></ActivityIndicator>
          tracksViewChanges = true;
        }
      } 
      else if(type == "collected") content  = CheckIcon;
      else if(type == "skipped") content = <Text style={style}>{"S"}</Text>;
      return(
        <Marker
          flat={false}
          key={pickup.key}
          coordinate={{
            latitude: pickup.location.latitude,
            longitude: pickup.location.longitude,
          }}
          tracksViewChanges={tracksViewChanges}
          onPress={()=>{
            this.setState({selectedPickup: pickup}, this.openPickupInfo)
          }}
        >
          <View
            style={{
              height: 25,
              width: 25,
              borderRadius: 25,
              backgroundColor: "white",
              borderWidth: 5,
              borderColor: "#5D1049",
              justifyContent:"center",
              alignItems:"center",
            }}>
            { content }
          </View>
        </Marker>
      )
    })
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
    let alertLocation = {};
    try{
      let firstPath = pickupPaths[0];
      let count = firstPath.length;
      let notificationIndex = (count) - Math.round(count / PATH_DIVISION_RATIO);
      pickupLocation = firstPath[count-1];
      alertLocation = firstPath[notificationIndex]; 
    }
    catch(e){
      console.log(e);
    }
    return {pickupLocation, alertLocation};
  }
  async sendPushNotification({ title, body }){
    // Build a channel
    var channel = new firebase.notifications.Android.Channel('pickup-notification', 'Pickup Notification', firebase.notifications.Android.Importance.Max)
    .setDescription('Channel for pickup notification');
    firebase.notifications().android.createChannel(channel);
    // Create the channel

    //var subscribedUsers = await firebase.firestore().collection("Users").where("pickupDocId","==", this.state.pendingCollections[0].key ).get();
    var subscribedUsers = await firebase.firestore().collection("Users").get();
    for( doc of subscribedUsers.docs){
      if(doc.data().pushToken != ""){
        var notification = new firebase.notifications.Notification()
        .setNotificationId(doc.data().pushToken)
        .setTitle(title)
        .setBody(body);
        notification
        .android.setChannelId('pickup-notification')
        .android.setSmallIcon('ic_launcher');

        await firebase.notifications().displayNotification(notification);
      }
    }
  }
  async alertSubscribers(){
    var result = false;
    try{
      var origin = this.state.currentLocation.latitude+","+this.state.currentLocation.longitude;
      var destination = this.state.pickupLocation.latitude + "," + this.state.pickupLocation.longitude;
      result = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${origin}&destinations=${destination}&departure_time=now&key=${GOOGLE_API_KEY}`);
      result = await result.json();
      var duration = result.rows[0].elements[0].duration_in_traffic.text;
      await this.sendPushNotification({
        title: "Incoming Truck Collector", 
        body: "ETA: " + duration
      });
      this.setState({ 
        isAlertLoading: false
      });
    }catch(e){ console.log(e) }
  }
  async collectPickup(){
    await this.sendPushNotification({
      title: "Truck Collector has reached your location", 
      body: "Collectors are now ready to get your trash"
    });
    var pendingCollections = [...this.state.pendingCollections];
    var collectedCollections = [...this.state.collectedCollections];
    
    var pickup = pendingCollections.shift();
    pickup.status = "collected";
    pickup.dataTime = new Date();
    collectedCollections.push(pickup);
    await firebase.firestore().collection("Collections").doc(pickup.key)
      .update({status: "collected", dataTime: new Date()});
    this.setState({
      collectedCollections,
    },()=>this.reRoute(pendingCollections));
  }
  openPickupInfo(){
    this.setState({isPickupInfoOpen: true}, async ()=>{
      Animated.spring(this.pickupInfoTranslateY,
        {
          toValue: 0,
          useNativeDriver: true,
        }
      ).start();
    });
  }
  closePickupInfo(){
    this.setState({isPickupInfoOpen: false}, async ()=>{
      Animated.spring(this.pickupInfoTranslateY,
        {
          toValue: -300,
          useNativeDriver: true,
        }
      ).start();
    });
  }
  setCollectorPosition(collectorPos){
    this.setState({
      currentLocation: collectorPos
    },async ()=>{
      if( !this.state.isReachedPickup && !this.state.isReachedAlert && getDistance(collectorPos, this.state.alertLocation) < METERS_TO_NOTIFY ){
        this.setState({isReachedAlert: true, isAlertLoading: true}, this.alertSubscribers);
      }
      else if( !this.state.isReachedPickup && getDistance(collectorPos, this.state.pickupLocation) < METERS_TO_REACH ){
        this.setState({isReachedPickup: true, isPickupLoading: true});
      }
    });
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
      let alertLocation = targetLocation.alertLocation;
      let originLocation = await getCurrentPosition();
      originLocation = originLocation.coords;
      let destinationLocation = dumpsiteLocation;
      let currentPickup = pendingCollections[0];
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
        alertLocation,
        originLocation,
        destinationLocation,
        currentPickup,
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

    var pendingCollectionsMarker = this.createPickupMarker("pending");
    var collectedCollectionsMarker = this.createPickupMarker("collected");
    var skippedCollectionsMarker = this.createPickupMarker("skipped");
    var notificationMarker = ()=>{
      var isAlertLoading = this.state.isAlertLoading;
      var isReachedAlert = this.state.isReachedAlert;
      if( this.state.alertLocation.latitude != ""){
        var label = null;
        var tracksViewChanges = false;
        if(!isAlertLoading && !isReachedAlert){
          label = <Text style={{color:Colors.purple, fontSize:9, fontWeight:"bold"}}>!</Text>
          
        }
        else if(isAlertLoading && isReachedAlert){
          label = <ActivityIndicator style={{transform:[{scale: .5}]}} size="small" color={Colors.purple} />
          tracksViewChanges = true;
        }
        else{ label = CheckIcon }
        return (
          <Marker
            flat={false}
            tracksViewChanges={tracksViewChanges}
            coordinate={{
              latitude: this.state.alertLocation.latitude,
              longitude: this.state.alertLocation.longitude,
            }}
          >
          <View style={{
            height:18, 
            width: 28,
            borderRadius: 10, 
            borderWidth: 1, 
            borderColor: Colors.purple, 
            backgroundColor:"white",
            justifyContent:"center",
            alignItems:"center",
          }}>{ label }</View>
          <Callout style={{ width: 50}}><Text style={{fontSize:9, fontWeight:"bold", margin:"auto"}}>Notification</Text></Callout>
          </Marker>
        )
      }
      return null;
    }
    var originMarker = ()=>{
      if( this.state.originLocation.latitude != ""){
        return (
          <Marker
            flat={false}
            tracksViewChanges={false}
            coordinate={{
              latitude: this.state.originLocation.latitude,
              longitude: this.state.originLocation.longitude,
            }}
          >
          <View style={{
            height:18, 
            width: 28,
            borderRadius: 10, 
            borderWidth: 1, 
            borderColor: Colors.purple, 
            backgroundColor:"white",
            justifyContent:"center",
            alignItems:"center",
          }}><Text style={{color:Colors.purple, fontSize:9, fontWeight:"bold"}}>start</Text></View>
          </Marker>
        )
      }
      return null;
    }
    var destinationMarker = ()=>{
      if( this.state.destinationLocation.latitude != ""){
        return (
          <Marker
            flat={false}
            tracksViewChanges={false}
            coordinate={{
              latitude: this.state.destinationLocation.latitude,
              longitude: this.state.destinationLocation.longitude,
            }}
          >
          <View style={{
            height:18, 
            width: 28,
            borderRadius: 10, 
            borderWidth: 1, 
            borderColor: Colors.purple, 
            backgroundColor:"white",
            justifyContent:"center",
            alignItems:"center",
          }}><Text style={{color:Colors.purple, fontSize:9, fontWeight:"bold"}}>end</Text></View>
          </Marker>
        )
      }
      return null;
    }
    var collectorMarker = () =>{
      if( this.state.isMockLocation && this.state.currentLocation.latitude != "" ){
        return (
          <Marker
            flat={false}
            tracksViewChanges={false}
            coordinate={{
              latitude: this.state.currentLocation.latitude,
              longitude: this.state.currentLocation.longitude,
            }}
          />
        )
      }
      return null;
    }
    var infoColorLabelStyle = ()=>{
      var pickupStatus = this.state.selectedPickup.status
      if( pickupStatus == "pending"){
        return { backgroundColor: "white" }
      }
      else if( pickupStatus == "collected"){
        return { backgroundColor: "green" }
      }
    }
    var pickupInfoContents = ()=>{
      var pickup = this.state.selectedPickup;
      return (
        <View>
          <Text>{"Address: "+ pickup.address}</Text>
          <Text>{"Status: "+ pickup.status}</Text>
        </View>
      )
      
    }
    var pickupInfoButtons = ()=>{
      var pickup = this.state.selectedPickup;
      var buttons = [];
      if(pickup.status == "pending"){
        if(pickup.key == this.state.currentPickup.key && this.state.isPickupLoading){
          buttons.push(
            <Button
              key={buttons.length}
              onPress={()=>{
                this.collectPickup();
              }}
              title="Collect"
            />
          )
        }
        else{
          buttons.push(
            <Text key={buttons.length}>{"Skip"}</Text>
          )
        }
      }
      else if (pickup.status == "collected"){
      }
      else if (pickup.status == "skipped"){
        buttons.push(<Text key={buttons.length}>{"Undo Skip"}</Text>)
      }
      return (
        <View>
          { buttons }
        </View>
      )
    }
    return (
      <View style={styles.container}>

        <Animated.View style={[ styles.pickupInfo, {translateY: this.pickupInfoTranslateY} ]}>
          <View style={styles.pickupInfoColorLabelBox}></View>
          <View style={styles.pickupInfoContentBox}>{ pickupInfoContents() }</View>
          <View style={styles.pickupInfoButtonBox}>{ pickupInfoButtons() }</View>
        </Animated.View>

        <View style={styles.reRouteButton}>
          <TouchableNativeFeedback
            onPressIn={()=>this.reRoute(this.state.pendingCollections)}
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
          showsMyLocationButton={false}
          toolbarEnabled={false}
          onLayout={async ()=>{
            await this.loadData();
          }}
          onPress={(event)=>{
            if(this.state.isMockLocation){
              this.setCollectorPosition(event.nativeEvent.coordinate);
            }
            this.closePickupInfo();
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
          { originMarker() }
          { destinationMarker() }
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
  reRouteButton:{
    position: "absolute",
    top: 135,
    right : -50,
    height: 50,
    width: 120,
    borderTopStartRadius:50,
    borderBottomStartRadius: 50,
    zIndex: 5000,
    backgroundColor: Colors.purple,
    elevation: 5,
  },
  pickupInfo:{
    position: "absolute",
    flexDirection:"row",
    height: 100,
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: "white",
    zIndex: 4000,
    borderRadius: 10,
  },
  pickupInfoColorLabelBox:{
    height: "100%",
    width:"5%",
    backgroundColor: "green", 
    borderBottomStartRadius: 10, 
    borderTopStartRadius: 10,
  },
  pickupInfoContentBox:{
    height:"100%",
    flex:1,
    backgroundColor: "pink",
  },
  pickupInfoButtonBox:{
    height:"100%", 
    width:"40%",
    borderBottomEndRadius: 10, 
    borderTopEndRadius: 10,
    backgroundColor: "blue",
  },
  
});
