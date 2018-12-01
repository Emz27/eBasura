
import React from 'react'
import { 
    View,
    Text, 
    TouchableNativeFeedback,
    StyleSheet,
    Animated,
    Alert,
    StatusBar,
    AsyncStorage,
} from 'react-native'
import AppNavigator from './AppNavigator.js';
import Svg ,{Circle} from 'react-native-svg';
import Colors from './../constants/Colors.js';

import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
const OptionIcon = (<SimpleLineIcons name="options" size={30} color="white" />)
const MapIcon = (<FontAwesome5 name="route" size={20} color="white" />)
const UserIcon = (<FontAwesome5 name="users-cog" size={20} color="white" />)
const PickupIcon = (<MaterialCommunityIcons name="map-marker-radius" size={20} color="white" />)
const SignoutIcon = (<FontAwesome5 name="sign-out-alt" size={20} color="white" />)

function getActiveRouteName(navigationState) {
  if (!navigationState) {
    return null;
  }
  const route = navigationState.routes[navigationState.index];
  // dive into nested navigators
  if (route.routes) {
    return getActiveRouteName(route);
  }
  return route.routeName;
}




class Navigator extends React.Component{
    constructor(props){
      super(props);

      this.openScale = 1;
      this.closeScale = .7;
      this.openTranslate = 0;
      this.closeTranslate = 120;
      this.currentScale = new Animated.Value(this.closeScale);
      this.currentTranslate = new Animated.Value(this.closeTranslate);

      this.mapNavigationButtonScale = new Animated.Value(1);  
      this.pickupLocationButtonScale = new Animated.Value(1);

      this.translateMin = 100;
      this.translateMax = -110;
      
      this.mapNavigationButtonTranslateX = new Animated.Value(this.translateMin);
      this.userButtonTranslateY = new Animated.Value(this.translateMin);

      this.pickupLocationButtonTranslateY = new Animated.Value(this.translateMin);
      this.pickupLocationButtonTranslateX = new Animated.Value(this.translateMin);

      this.nameButtonTranslateX = new Animated.Value(200);
      this.signOutButtonTranslateX = new Animated.Value(200);
      this.userButtonScale = new Animated.Value(1);
      this.userName = "";
      
      this.state =  {
        isNavigatorOpen: false,
        isUserOpen: false,
        currentScreen: "MapNavigation",

        isRefRetrieved: false,
        isLogged: false,
        navigatorRef: {}
      };
    }
    loadUser = async ()=>{
      try{  
        this.user = JSON.parse(await AsyncStorage.getItem('user'));
        this.setState({ userId: this.user.userId })
      }
      catch(e){
        console.log(e);
      }
    }
    componentDidMount(){

    }
    handlePressIn = ()=>{
      var anims = []
      var closeTranslateAnim  = ( animObject, toValue )=> Animated.spring( animObject,{toValue:toValue, useNativeDriver: true});
      
      var value = .7;
      if(this.state.isUserOpen){
        anims.push(Animated.spring(this.userButtonScale,{toValue: 1, useNativeDriver: true}));
        anims.push(Animated.spring(this.nameButtonTranslateX,{toValue: 200, useNativeDriver: true}));
        anims.push(Animated.spring(this.signOutButtonTranslateX,{toValue: 200, useNativeDriver: true}));
      }
      if(this.state.isNavigatorOpen){

        anims.push(closeTranslateAnim(this.userButtonTranslateY, this.translateMin));
        anims.push(closeTranslateAnim(this.mapNavigationButtonTranslateX, this.translateMin));
        anims.push(closeTranslateAnim(this.pickupLocationButtonTranslateX, this.translateMin));
        anims.push(closeTranslateAnim(this.pickupLocationButtonTranslateY, this.translateMin));
      }
      anims.push(Animated.spring(this.currentScale,{toValue: value ,useNativeDriver: true}));
      Animated.parallel(anims,{stopTogether:false, useNativeDriver: true}).start();
    }
    handlePressOut = ()=>{
      var openTranslateAnim = ( animObject, toValue )=> Animated.spring(animObject,{toValue: toValue,friction: 5,tension: 20, useNativeDriver: true})
      var value = .7;
  
      var anims = [];
      
      if(!this.state.isNavigatorOpen){
        value = 1
        anims.push(openTranslateAnim(this.userButtonTranslateY, this.translateMax));
        anims.push(openTranslateAnim(this.mapNavigationButtonTranslateX, this.translateMax));
        anims.push(openTranslateAnim(this.pickupLocationButtonTranslateX, this.translateMax*.7));
        anims.push(openTranslateAnim(this.pickupLocationButtonTranslateY, this.translateMax*.7));
      }
      anims.push(Animated.spring(
        this.currentScale,{toValue: value, friction: 5,tension: 20, useNativeDriver: true})
      );
      this.setState({
        isNavigatorOpen: !this.state.isNavigatorOpen,
        isUserOpen: false,
      },()=>
        Animated.parallel(anims,{stopTogether:true, useNativeDriver: true}).start()
      )
  
    }
    handleUserPressIn = ()=>{
      var value = .7;

      var anims = [];
      if(this.state.isUserOpen){
        value = .9;
        anims.push(Animated.spring(this.nameButtonTranslateX,{toValue: 200, useNativeDriver: true}));
        anims.push(Animated.spring(this.signOutButtonTranslateX,{toValue: 200, useNativeDriver: true}));
      } 
      anims.push(Animated.spring(this.userButtonScale,{toValue: value, useNativeDriver: true}))
      Animated.parallel(anims,{ stopTogether: false, useNativeDriver: true }).start();
    }
    
    handleUserPressOut = ()=>{
      var value = 1;
      var anims = [];

      if(!this.state.isUserOpen){
        value = 1.5;
        anims.push(Animated.spring( this.nameButtonTranslateX, { toValue: 0, friction: 5,tension: 20, useNativeDriver: true }));
        anims.push(Animated.spring( this.signOutButtonTranslateX, { toValue: 0,friction: 5,tension: 20, useNativeDriver: true }));
      } 
      anims.push(Animated.spring(this.userButtonScale,{toValue: value,friction: 3,tension: 40, useNativeDriver: true}).start());
      this.setState({isUserOpen: !this.state.isUserOpen}, ()=>{
        Animated.parallel(anims,{ stopTogether: false, useNativeDriver: true}).start()
      });
    }
    handleNavigatorPressIn = (button)=>{
      // if(button == this.state.currentScreen) return false;
      // var scale = (button == "MapNavigation")?this.mapNavigationButtonScale: this.pickupLocationButtonScale;
      this.state.navigatorRef._navigation.navigate(button);
      // Animated.spring(scale,{toValue: .7, useNativeDriver: true}).start();
    }


    handleNavigatorPressOut = (button)=>{
      // if(button == this.state.currentScreen) return false;
      
      // var scale = (button == "MapNavigation")?this.mapNavigationButtonScale: this.pickupLocationButtonScale;
      // Animated.spring(scale,{toValue: 1,friction: 3,tension: 40, useNativeDriver: true}).start();
    }

    activateNavigatorButton = (button)=>{
      if(!["MapNavigation", "PickupLocations"].includes(button)) return false;
      var scale1 = (button == "MapNavigation")?this.mapNavigationButtonScale: this.pickupLocationButtonScale;
      var scale2 = (button != "MapNavigation")?this.mapNavigationButtonScale: this.pickupLocationButtonScale;

      Animated.parallel([
        Animated.spring(scale1,{toValue: 1.5, friction: 4,tension: 30, useNativeDriver: true}),
        Animated.spring(scale2,{toValue: 1, useNativeDriver: true}),
      ],{stopTogether:false, useNativeDriver: true})
      .start();
    }
    render(){
      const animatedStyle = {

        transform:[{scale:this.currentScale}]
      }
      return(
        
        <View style={styles.container}>
          <AppNavigator 
            onNavigationStateChange={(prevState, currentState) => {
              const currentScreen = getActiveRouteName(currentState);
              const prevScreen = getActiveRouteName(prevState);
        
              if (prevScreen !== currentScreen) {
                console.log("screen changed", currentScreen);
                var isLogged = false;
                if(["AuthLoading","SignIn"].includes(currentScreen)) isLogged = false;
                else {
                  this.loadUser();
                  isLogged = true;
                } 
                this.activateNavigatorButton(currentScreen);
                this.setState({ isLogged, currentScreen });
              }
            }}
            ref={(navigatorRef)=>{
              if(!this.state.isRefRetrieved){
                this.setState({
                  navigatorRef: navigatorRef,
                  isRefRetrieved: true,
                })
              }
            }}
          />
          {
            (this.state.isRefRetrieved && this.state.isLogged)
            ?<View style={styles.container}>
              <StatusBar
                backgroundColor={Colors.purpleDark}
              />
              <View style={styles.header}></View>
              <View style={styles.footer}>
              </View>
              <Animated.View
                style={[styles.nameButton,{translateX: this.nameButtonTranslateX}]}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
                  >
                  <View
                    style={[{
                      height:150,
                      width:150,
                      flex:1,
                      justifyContent:"center",
                      alignItems: "center",
                    }]}
                  ><Text style={{color:"white"}}>{ this.state.userId }</Text></View>
                  </TouchableNativeFeedback>
              </Animated.View>
              <Animated.View
                style={[styles.signOutButton, {translateX: this.signOutButtonTranslateX}]}>
                <TouchableNativeFeedback
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
                  >{ SignoutIcon }</View>
                  </TouchableNativeFeedback>
              </Animated.View>
              <Animated.View
                style={[styles.mainActionButton,animatedStyle]}>
                <TouchableNativeFeedback
                    onPressIn={this.handlePressIn}
                    onPressOut={this.handlePressOut}
                    background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
                  >
                  <View
                    style={[{
                      height:150,
                      width:150,
                      flex:1,
                      justifyContent:"center",
                      alignItems: "center",
                    }]}
                  >{ OptionIcon }</View>
                  </TouchableNativeFeedback>
              </Animated.View>
              <Animated.View
                style={[styles.UserButton, {transform:[{translateY: this.userButtonTranslateY},{scale: this.userButtonScale},]}]}>
                <TouchableNativeFeedback
                    onPressIn = {this.handleUserPressIn}
                    onPressOut = {this.handleUserPressOut}
                    background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
                  >
                  <View
                    style={smallView}
                  >{ UserIcon }</View>
                  </TouchableNativeFeedback>
              </Animated.View>
              <Animated.View
                style={[styles.PickupLocationButton, {transform:[{translateX: this.pickupLocationButtonTranslateX},{translateY: this.pickupLocationButtonTranslateY},{scale: this.pickupLocationButtonScale}]}]}>
                <TouchableNativeFeedback
                    onPressIn={()=>this.handleNavigatorPressIn("PickupLocations")}
                    onPressOut={()=>this.handleNavigatorPressOut("PickupLocations")}
                    background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
                  >
                  <View
                    style={smallView}
                  >{ PickupIcon }</View>
                  </TouchableNativeFeedback>
              </Animated.View>
              <Animated.View
                style={[styles.mapNavigationButton, {transform:[{translateX: this.mapNavigationButtonTranslateX}, {scale: this.mapNavigationButtonScale}]}]}>
                <TouchableNativeFeedback
                    onPressIn={()=>this.handleNavigatorPressIn("MapNavigation")}
                    onPressOut={()=>this.handleNavigatorPressOut("MapNavigation")}
                    background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
                  >
                  <View
                    style={smallView}
                  >{ MapIcon }</View>
                  </TouchableNativeFeedback>
              </Animated.View>
            </View>
            :<View></View>
          }
      </View>
      )
      
    }
}
const smallSize = 50;
const smallButton = {
  position:"absolute",
  borderRadius:smallSize,
  zIndex:1000,
  backgroundColor:Colors.purpleDark,
  elevation:10
}
const smallView = {
  height: smallSize,
  width: smallSize,
  justifyContent:"center",
  alignItems: "center",
}

const styles = StyleSheet.create({
  container:{
    height:"100%",
    width:"100%",
    position: "absolute",
  },
  header:{
    position:"absolute",
    top: 0,
    height: 40,
    width: "100%",
    backgroundColor: Colors.purple

  },
  footer:{
    position:"absolute",
    bottom: 0,
    height: 40,
    width: "100%",
    backgroundColor: Colors.purple
  },
  mainActionButton:{
    position:"absolute",
    borderRadius:150,
    bottom:-50,
    right:-50,
    zIndex:5000,
    backgroundColor:Colors.purpleDark,
    elevation:10
  },
  UserButton:{
    ...smallButton,
    bottom:20,
    right:20,
  },
  PickupLocationButton:{
    ...smallButton,
    bottom:20,
    right:20,
  },
  mapNavigationButton:{
    ...smallButton,
    bottom:20,
    right:20,
  },
  signOutButton:{
    position: "absolute",
    right : -50,
    bottom: 280,
    height: 50,
    width: 120,
    borderTopStartRadius:50,
    borderBottomStartRadius: 50,
    zIndex: 5000,
    backgroundColor: Colors.purple,
    elevation: 5,
  },
  nameButton:{
    position: "absolute",
    right : -50,
    bottom: 210,
    height: 50,
    width: 170,
    borderTopStartRadius:50,
    borderBottomStartRadius: 50,
    zIndex: 5000,
    backgroundColor: Colors.purple,
    elevation: 5,
  },
})


export{
  Navigator,
};