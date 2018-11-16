import { parse, stringify} from 'flatted/esm'
import React from 'react';
import {
  ActivityIndicator,
  AsyncStorage,
  StatusBar,
  StyleSheet,
  View,
  Platform
} from 'react-native';
import { Constants, Location, Permissions } from 'expo';

import * as firebase from 'firebase';
import 'firebase/firestore';
import moment from 'moment';

const GOOGLE_API_KEY = 'AIzaSyAKLNDKXRY5niSySOE8TIdz2yFgBmHyhjo';

export default class AuthLoadingScreen extends React.Component {
  constructor(props) {
    super(props);
    try{
      this._bootstrapAsync();
    }
    catch(error){
      console.log(error);
    }
  }
  async componentWillMount() {
    if (Platform.OS === 'android' && !Constants.isDevice) {
    } 
    else {
      let { status } = await Permissions.askAsync(Permissions.LOCATION);
      if (status !== 'granted') {
      }
    }
  }
  // Fetch the token from storage then navigate to our appropriate place
  _bootstrapAsync = async () => {
    //await AsyncStorage.clear();
    const { navigate } = this.props.navigation;
    const userToken = JSON.parse(await AsyncStorage.getItem('user'));
    if (!userToken) return navigate('SignIn');

    let token = userToken;
    console.log('auth')
    console.log(token.userId)
    let userData = await firebase.firestore().collection('Users').where('userId','==',token.userId).get();

    if ( userData.docs.length ){
      this.user = { key: userData.docs[0].id, ...userData.docs[0].data() };
      await this.loadData();
      return navigate('Main', JSON.stringify({ 'user':this.user }));
    }
    else {
      await AsyncStorage.removeItem('user');
      return navigate('SignIn');
    }
  };
  loadData = async ()=>{
    let collectionsToday = [];
    let collectionsHistory = [];
    let collections = await firebase.firestore().collection("Collections")
                                .where("collectors","array-contains",this.user.userId)
                                .get();
    console.log("load successful");
    collections.docs.forEach((doc)=>{
      let currentDate = Date.now();
      let collectionDate = new Date(doc.data().dateTime.toDate());
      console.log(`current date: ${currentDate}, doc date: ${collectionDate}, isSame : ${moment(currentDate).isSame(collectionDate,'day')}`)
      var data = doc.data();
      var col = {
        key: doc.id,
        address: data.address,
        comment: data.comment,
        dateTime: data.dateTime,
        location: data.location,
        pickupId: data.pickupId,
        pickupDocId: data.pickupDocId,
        status: data.status,
        truckDocId: data.truckDocId,
        collectors: data.collectors,
      }
      if(moment(currentDate).isSame(collectionDate,'day')){
        collectionsToday.push(col);
      }
      else collectionsHistory.push(col);
    });


    console.log("collectionsToday length: "+collectionsToday.length);
    console.log("collectionsHistory length: "+collectionsHistory.length);
    let origin= await Location.getCurrentPositionAsync();
    origin = origin.coords.latitude+","+origin.coords.longitude;
    console.log(`origin : ${origin}`);
    let destination = origin;
    let waypoints = collectionsToday.map( item => item.location._lat+','+item.location._long ).join('|');
    console.log(`waypoints : ${waypoints}`);
    let response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypoints}&key=${GOOGLE_API_KEY}`);
    let responseJson = await response.json();
    
    let route = responseJson.routes[0];
    console.log("route: "+route);
    this.coordinates = [];
    this.paths = [];
    route.legs.forEach((leg)=>{
      leg.steps.forEach((step)=>{
        let startLatLng = {latitude: step.start_location.lat, longitude: step.start_location.lng};
        let endLatLng = {latitude: step.end_location.lat, longitude: step.end_location.lng}
        this.coordinates.push(startLatLng);
        this.coordinates.push(endLatLng);
      })
    })
    let snapToRoadPointsInput = this.coordinates.map((coord)=>{
      return coord.latitude+","+coord.longitude;
    }).join("|");

    let snapToRoadPointsResult = await fetch(`https://roads.googleapis.com/v1/snapToRoads?path=${snapToRoadPointsInput}&key=${GOOGLE_API_KEY}`)
    let snapToRoadPoints = await snapToRoadPointsResult.json();
    
    this.paths = snapToRoadPoints.snappedPoints.map((point)=>point.location);
    console.log( JSON.stringify(this.paths));

    await AsyncStorage.setItem('user', JSON.stringify(this.user));
    //console.log(collections);
    //await AsyncStorage.setItem('collections', JSON.stringify(collections));
    console.log(collectionsToday);

    console.log(collectionsToday[0].address);
    await AsyncStorage.setItem('collectionsToday',  JSON.stringify(collectionsToday));
    await AsyncStorage.setItem('collectionsHistory',  JSON.stringify(collectionsHistory));
    await AsyncStorage.setItem('route',  JSON.stringify(route));
    await AsyncStorage.setItem('coordinates',  JSON.stringify(this.coordinates));
    await AsyncStorage.setItem('paths',  JSON.stringify(this.paths));

  }
  // Render any loading content that you like here
  render() {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
        <StatusBar barStyle="default" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});