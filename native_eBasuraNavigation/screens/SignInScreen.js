
import React from 'react';
import {
  ActivityIndicator,
  AsyncStorage,
  Button,
  StatusBar,
  StyleSheet,
  View,
  TextInput,
  Text,
  PermissionsAndroid ,
  NetInfo,
  ImageBackground
} from 'react-native';

import Images from './../assets/index';
import firebase from 'react-native-firebase';
import images from './../assets/index';

const screenName = "SignInScreen";
const log = (message = "", data = {})=>{
  console.log(screenName + " --> "+ message, data);
}

export default class SignInScreen extends React.Component {
  static navigationOptions = {
    title: 'Please sign in',
  };
  constructor(props){
    super(props);
    log("SignInScreen Start");
    this.state = {
      userId: '',
      password: '',
      userIdError: '',
      passwordError: '',
    }
    
  }
  onInputChange = (input)=>{
    this.setState({
      userIdError: '',
      passwordError: '',
      ...input,
    });
  }
  rememberUser = async (userId) =>{
    await AsyncStorage.setItem()
  }
  onSubmit = async ()=>{
    log("clicked submit");
    let errorLabel = false;
    if(this.state.userId.length <= 0){
      log("Username empty");
      errorLabel = true;
      this.setState({userIdError: 'This field is required'})
    }
    if(this.state.password.length <= 0){
      log("Password empty");
      errorLabel = true;
      this.setState({passwordError: 'This field is required'})
    }
    if(errorLabel) {
      log("Error detected from validation");
      return false;
    }
    log("Get user by userId start", this.state.userId);
    try{
      Users = await firebase.firestore().collection('Users').where('userId','==',this.state.userId).get();
    }
    catch(e){
      console.log("fail fetch user");
    }
    log("Get user end");
    log("Number of match", Users.docs.length);

    if( !Users.docs.length ){
      return this.setState({
        userIdError: 'User doesnt exist'
      })
    }
    else if( Users.docs[0].data().password != this.state.password){
      log("Error in validation detected");
      return this.setState({
        passwordError: 'User ID and Password does not match'
      })
    }
    log("Save session data start");
    try{
      await AsyncStorage.setItem('user', JSON.stringify({ key: Users.docs[0].id, ...Users.docs[0].data() }) );
    }
    catch(e){
      log("Save session failed", e)
    }
    log("Save session data end");
    log("Redirecting to AuthLoading")
    this.props.navigation.navigate('AuthLoading');
  }
  render() {
    return (
      <ImageBackground source={images.loginBackground} style={{width: '100%', height: '100%'}}>
      <View style={styles.container}>
        <TextInput
          style={{
            height: 40, width: 120, borderColor: 'gray', borderWidth: 1, textAlign: 'center',
            backgroundColor: "white"
          }}
          onChangeText={(text) => this.onInputChange({userId:text})}
          value={this.state.userId}
          placeholder="Username"
        />
        <Text style={{color: "white", paddingTop: 5, paddingBottom: 10}}>{this.state.userIdError}</Text>
        <TextInput
          style={{
            height: 40, width: 120, borderColor: 'gray', borderWidth: 1, textAlign: 'center',
            backgroundColor: "white"
          }}
          onChangeText={(text) => this.onInputChange({password:text})}
          value={this.state.password}
          secureTextEntry={true}
          placeholder="Password"
        />
        <Text style={{color: "white", paddingTop: 5, paddingBottom: 10}}>{this.state.passwordError}</Text>
        <Button title="Sign in!" onPress={this.onSubmit} />
      </View>
      </ImageBackground>
    );
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIdTextInput:{

  },
  passwordTextInput:{

  },
  
});