
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

// import {MapView, Marker, Polyline } from 'react-native-maps'
import MapView from 'react-native-maps'
import {Marker, Polyline} from 'react-native-maps'

import Svg, {Circle,Text as SText,TSpan} from 'react-native-svg';

import Colors from './../constants/Colors.js';




let { width, height } = Dimensions.get('window')
const ASPECT_RATIO = width / height
const LATITUDE_DELTA = 0.008
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

// const screenName = "MapNavigationScreen";
// const log = (message = "", data = {})=>{
//   return console.console.log(screenName + " --> "+ message, data);
// }

export default class MapNavigationScreen extends React.Component {
  static navigationOptions = {
    header: null,
  }
  constructor(props){
    super(props);
    console.log("MapNavigationScreen Start");
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
    console.log("Load Data start");
    try{
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
    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor="blue"
          hidden = {true}
        />
        <View style={{
          position:"absolute",
          top: 0,
          height: 50,
          width:"100%",
          backgroundColor: "white",
          zIndex: 1000,
        }}>
        <FlatList
          horizontal={true}
          data={this.state.collectionsToday}
          renderItem={({item, index}) => 
          <View
            style={{
              height: 20,
              width: 50,
              borderBottomColor:"black",
              borderBottomWidth: 2,
              borderTopColor:"black",
              borderTopWidth: 2,
              backgroundColor: "red",
              
              
            }}>
            <View
              style={{
                height: 20,
                width: 50,
                borderEndColor:"black",
                borderEndWidth:5,
                borderTopEndRadius: 20,
                borderBottomEndRadius: 20,
                position:"absolute",
                translateX: 1,
                // transform:[{rotateY:"40deg"},{rotateZ: "40deg"}]
                zIndex: index+5000,
              }}
            >
            <Text>{index}</Text>
            </View>

            
          </View>
        }
        />
        </View>
        <MapView
          style={styles.map}
          ref={ref => { this.map = ref; }}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          onLayout={()=>{
            
          }}
        >
            <Polyline 
              coordinates={this.paths}
              strokeColor={Colors.secondaryLight}
              strokeColors={strokeColors}
              strokeWidth={6}
              miterLimit={50}
            />
          {

            this.state.collectionsToday.map((pickup,index)=>{
              return(
                <Marker
                  flat={true}
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
                {/* <Svg
                  height="40"
                  width="40"
                >
                  <Circle
                    cx="20"
                    cy="20"
                    r="20"
                    fill="green"
                    strokeWidth="2"
                    stroke="white"
                  />
                  <SText y="20">
                    <TSpan x="10" >{index+1}</TSpan>
                  </SText>
                </Svg> */}
                <View
                  style={{
                    height: 25,
                    width: 25,
                    borderRadius: 25,
                    // borderBottomEndRadius: 25,
                    // borderBottomStartRadius: 25,
                    backgroundColor:Colors.secondaryDark,
                    borderWidth: 2,
                    borderColor: Colors.secondaryLight,
                    justifyContent:"center",
                    alignItems:"center",

                  }}>
                  <Text
                    style={{color:"white", fontSize: 9}}>
                    {index+1}
                  </Text>
                </View>

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
  },
  xFloatingContainer:{
    position:"absolute",
    flexDirection:"row-reverse",
    alignItems:"flex-start",
    width:"100%",
    marginRight:"50%",
    bottom:0,
    zIndex:3000,
    backgroundColor:"white",
    borderTopStartRadius:10000,
    
  },
  yFloatingContainer:{
    position:"absolute",
    flexDirection:"column-reverse",
    alignItems:"center",
    height:"100%",
    bottom:10,
    right:10,
    zIndex:3000,
    paddingBottom:120,
  },
  xFloatingItem:{
    marginLeft: 30,
    borderRadius: 50,
    height: 50,
    width: 50,
    backgroundColor: "#388e3c",
    elevation: 10,
    top:-20,
  },
  yFloatingItem:{
    marginTop: 30,
    borderRadius: 500,
    height: 50,
    width: 50,
    backgroundColor: "#388e3c",
    elevation: 10,
  },
});
