import React from 'react';
import { TouchableOpacity,TouchableNativeFeedback, Button, TouchableWithoutFeedback, Text, View, AsyncStorage, FlatList, StyleSheet, Animated, Dimensions } from 'react-native'
import { MapView , Icon, } from 'expo'
import { ExpoConfigView } from '@expo/samples';


import * as firebase from 'firebase';
import 'firebase/firestore';

import { MonoText } from '../components/StyledText';

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
      type:"current",
    }
    this.coordinates = [];
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
      pickup.infoLeftOpenOffset = (-1)*windowX*.1;
      pickup.infoRightOpenOffset = windowX*.1;
      pickup.infoLeftCloseOffset = (-1)*windowX*.4;
      pickup.infoRightCloseOffset = windowX*.4;
      pickup.isOpen = false;
      pickup.infoLeftCurrentOffset = new Animated.Value( pickup.infoLeftCloseOffset );
      pickup.infoRightCurrentOffset = new Animated.Value( pickup.infoRightCloseOffset );
      return pickup;
    });
    this.coordinates = [];
    pickupLocations.forEach((pickup, index)=>{
      this.coordinates.push({
        latitude: pickup.location._lat,
        longitude: pickup.location._long,
      })
    })
    console.log(JSON.stringify(this.coordinates)+"hello coordinates");
    this.map.fitToCoordinates(this.coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
    //this.map.fitToSuppliedMarkers(this.coordinates, true);
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
  onItemPress = async (item)=>{

    this.map.animateToNavigation({
      latitude: item.location._lat,
      longitude: item.location._long,
    },0,0);
    item.markerRef.showCallout();
    const anims = [];
    var addAnim = (pickupItem, type)=>{
      anims.push(
      Animated.spring(
        pickupItem.infoLeftCurrentOffset,
        {
          toValue: (type!="open")?pickupItem.infoLeftCloseOffset: pickupItem.infoLeftOpenOffset,
          friction: 3,
          tension: 40,
          useNativeDriver: true,}
      ),
      Animated.spring(
        pickupItem.infoRightCurrentOffset,
        {
          toValue: (type!="open")?pickupItem.infoRightCloseOffset: pickupItem.infoRightOpenOffset,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }
      ));
      if(type!="open")pickupItem.isOpen = false;
      else pickupItem.isOpen = true;
    };
    
    var openItems = this.state.pickuplocations.filter((i)=>{
      return i.isOpen == true;
    });
    if(openItems.length){
      openItems.forEach((i)=>{
        if(i.key != item.key)addAnim(i,"close");
      })
    }
    if(item.isOpen) addAnim(item,"close");
    else addAnim(item,"open");

    Animated.parallel( anims,{ useNativeDriver: true }).start();
    
  }
  render() {
    /* Go ahead and delete ExpoConfigView and replace it with your
     * content, we just wanted to give you a quick view of your config */

    
    

    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
        <TouchableOpacity
          style={{
              borderWidth:1,
              borderColor:'rgba(0,0,0,0.2)',
              alignItems:'center',
              justifyContent:'center',
              width:100,
              height:30,
              backgroundColor:'#fff',
              borderRadius:30,
              elevation:2,
              marginHorizontal:20,
              marginVertical:"auto",
              borderColor:((this.state.type == "current")?"blue":"black")
            }}
          onPress={()=>{
            this.setState({type:"current"});
          }}
        >
          <MonoText style={[{color:(this.state.type == "current")?"blue":"black"}]}>Current</MonoText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[{
              borderWidth:1,
              borderColor:'rgba(0,0,0,0.2)',
              alignItems:'center',
              justifyContent:'center',
              width:100,
              height:30,
              backgroundColor:'#fff',
              borderRadius:30,
              elevation:2,
              marginHorizontal:20,
              marginVertical:"auto",
              borderColor:((this.state.type == "history")?"blue":"black")
            }]}
          onPress={()=>{
            this.setState({type:"history"});
          }}
        >
            <MonoText style={[{color:(this.state.type == "history")?"blue":"black"}]}>History</MonoText>
        </TouchableOpacity>
        </View>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            ref={ref => { this.map = ref; }}
            initialRegion={{
              latitude: 14.61881,
              longitude: 121.057171,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
          }}>
            {
              this.state.pickuplocations.map((pickup,index)=>{
                return(
                  <MapView.Marker
                    key={pickup.key}
                    coordinate={{
                      latitude: pickup.location._lat,
                      longitude: pickup.location._long,
                    }}
                    ref={ref => { pickup.markerRef = ref; }}
                    title={pickup.pickupid}
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
        <View style={styles.listContainer}>
          <FlatList
            data={this.state.pickuplocations}
            renderItem={({item}) => {
              let statusColor = "white"
              switch(item.status){
                case "missed":{
                  statusColor = "gray"
                  break;
                }
                case "collected":{
                  statusColor = "green"
                  break;
                }
                default:{
                  break;
                }
              }
              return (
              <View style={styles.itemContainer}>
                <TouchableNativeFeedback
                    onPress={()=>{
                      this.onItemPress(item);
                    }}
                    background={TouchableNativeFeedback.SelectableBackground()}>
                  <View style={styles.itemContentContainer}>
                    <MonoText>{item.pickupid}</MonoText>
                    <MonoText style={{fontSize: 9}}>{item.address}</MonoText>
                    <MonoText style={{fontSize: 10}}>{
                      (()=>{
                        if( item.status == "collected") return "Collection: "+item.datetime;
                        else if( item.status == "missed" ) return "Missed Collection: "+item.datetime;
                        else return "- - -";
                      })()
                    }</MonoText>
                  </View>
                </TouchableNativeFeedback>
                <Animated.View 
                  style={[
                      { 
                        transform: [{ translateX: item.infoLeftCurrentOffset }] 
                      },
                      styles.itemInfoContainer,
                      styles.itemLeftInfoContainer,
                      {
                        backgroundColor: statusColor
                      },
                    ]}
                >
                  <View style={{overflow:"hidden",flex:1,flexDirection:"row",alignItems: "center", alignContent: "space-between", elevation:2, backgroundColor:"white", margin:5,paddingRight: windowX*.1,paddingLeft: windowX*.1, borderRadius: 10}}>
                    <MonoText>{item.status}</MonoText>
                  </View>
                </Animated.View>
                <Animated.View 
                  style={[
                    { 
                      transform: [{ translateX: item.infoRightCurrentOffset }] 
                    },
                    styles.itemInfoContainer,
                    styles.itemRightInfoContainer,
                    {
                      backgroundColor: statusColor
                    },
                  ]}
                >
                  <View style={{flex:1,flexDirection:"row",alignItems: "center", alignContent: "space-between", elevation:2, backgroundColor:"white", margin:5,paddingLeft: windowX*.1, borderRadius: 10}}>
                  <TouchableOpacity
                    style={{
                        borderWidth:1,
                        borderColor:'rgba(0,0,0,0.2)',
                        alignItems:'center',
                        justifyContent:'center',
                        width:30,
                        height:30,
                        backgroundColor:'#fff',
                        borderRadius:30,
                        elevation:2,
                        marginLeft:5,
                      }}
                  >
                    <Icon.AntDesign
                        name="message1"
                        size={17}
                      />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                        borderWidth:1,
                        borderColor:'rgba(0,0,0,0.2)',
                        alignItems:'center',
                        justifyContent:'center',
                        width:30,
                        height:30,
                        backgroundColor:'#fff',
                        borderRadius:30,
                        elevation:2,
                        marginHorizontal:5,
                      }}
                      onPress={()=>{
                        this.props.navigation.navigate('PickupDetail',{pickup:item});
                      }}
                  >
                    <Icon.MaterialCommunityIcons
                        name="information-outline"
                        size={17}
                      />
                  </TouchableOpacity>
                  </View>
                </Animated.View>
              </View>)
              }
            }
          />
        </View>
      </View>
    );
  }
}


const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:"white",
  },
  headerContainer:{
    height:50,
    elevation: 3,
    flexDirection:"row",
    justifyContent:"center",
    alignItems:"center",
    backgroundColor:"white",
    //position:"absolute",
    //top:20,
    zIndex: 1000,
  },
  mapContainer:{
    flex:2,
    zIndex:-1,
  },
  map:{
    flex:1,
    zIndex:-1,
  },
  listContainer :{
    flex:3,
    elevation:10,
    backgroundColor:"white",
  },
  itemContainer :{
    height:80,
    marginTop: 5,
  },
  itemContentContainer: {
    flex:1,
    backgroundColor: "white",
    borderRadius:5,
    marginHorizontal:10,
    alignItems: "center",
    borderWidth:.7,
    borderColor:"#aaa",
    paddingHorizontal:windowX*.1,
  },
  itemInfoContainer:{
    position: "absolute",
    width: "50%",
    top:8,
    bottom:8,
    backgroundColor: "white",
    elevation:2,
  },
  itemLeftInfoContainer: {
    left: 0,
    borderTopRightRadius:10,
    borderBottomRightRadius:10,
  },
  itemRightInfoContainer: {
    right: 0,
    borderTopLeftRadius:10,
    borderBottomLeftRadius:10,
  },
});