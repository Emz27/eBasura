
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

//import { Constants, Permissions, MapView } from 'expo';
import {MapView, Marker, Polyline } from 'react-native-maps'


import { MonoText } from '../components/StyledText';
import moment from 'moment';
import firebase from 'react-native-firebase';


let { width, height } = Dimensions.get('window')
const ASPECT_RATIO = width / height
const LATITUDE_DELTA = 0.008
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO



export default class MapNavigationScreen extends React.Component {
  static navigationOptions = {
    header: null,
  }
  constructor(props){
    super(props);
    this.loadData();
    this.state = {
      collectionsHistory:[],
      collectionsToday: [],
      route: {legs:[]}
    };

    this.coordinates = [];
    this.paths = [];

  }
  async componentWillMount() {
    // if (Platform.OS === 'android' && !Constants.isDevice) {

    // } 
    // else {
    //   let { status } = await Permissions.askAsync(Permissions.LOCATION);
    //   if (status !== 'granted') {

    //   }
    // }
  }
  onComponentDidMount(){
    
  }
  loadData = async ()=>{
    this.user = JSON.parse(await AsyncStorage.getItem('user'));
    //let collections = JSON.parse(await AsyncStorage.getItem("collections"));
    let collectionsToday = JSON.parse(await AsyncStorage.getItem("collectionsToday"));
    let collectionsHistory = JSON.parse(await AsyncStorage.getItem("collectionsHistory"));
    let route = JSON.parse(await AsyncStorage.getItem("route"));
    this.coordinates = JSON.parse(await AsyncStorage.getItem("coordinates"));;
    this.paths = JSON.parse(await AsyncStorage.getItem("paths"));;
    this.map.fitToCoordinates(this.coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
    this.setState({
      collectionsToday,
      collectionsHistory,
      route: route
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
          showsUserLocation={true}
          showsMyLocationButton={true}
          onLayout={()=>{
            
          }}
        >
            <Polyline 
              coordinates={this.paths}
              strokeColor="#000"
              strokeColors={strokeColors}
              strokeWidth={6}
              miterLimit={50}
            />
          {

            this.state.collectionsToday.map((pickup,index)=>{
              return(
                <Marker
                  key={pickup.key}
                  coordinate={{
                    latitude: pickup.location.latitude,
                    longitude: pickup.location.longitude,
                  }}
                  title={pickup.pickupid}
                  description={(index+1).toString()}
                  onCalloutPress={()=>{
                    this.props.navigation.navigate('PickupDetail',{pickup:pickup});
                  }}
                >
                </Marker>
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
