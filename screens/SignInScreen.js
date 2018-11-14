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
} from 'react-native';
import { createStackNavigator, createSwitchNavigator } from 'react-navigation';

import * as firebase from 'firebase';
import 'firebase/firestore';

export default class SignInScreen extends React.Component {
  static navigationOptions = {
    title: 'Please sign in',
  };
  constructor(props){
    super(props);
    this.state = {
      userid: '',
      password: '',
      useridError: '',
      passwordError: '',
    }
  }
  onInputChange = (input)=>{
    this.setState({
      useridError: '',
      passwordError: '',
      ...input,
    });
  }
  rememberUser = async (userid) =>{
    await AsyncStorage.setItem()
  }
  onSubmit = async ()=>{
    let error = false;
    if(!this.state.userid){
      error = true;
      this.setState({useridError: 'This field is required'})
    }
    if(!this.state.password){
      error = true;
      this.setState({passwordError: 'This field is required'})
    }
    if(error) return false;

    let users = await firebase.firestore().collection('users').where('userid','==',this.state.userid).get();
    console.log(users.docs.length)

    if( !users.docs.length ){
      return this.setState({
        useridError: 'User doesnt exist'
      })
    }
    else if( users.docs[0].data().password != this.state.password){
      return this.setState({
        passwordError: 'User ID and Password does not match'
      })
    }
    await AsyncStorage.setItem('eBasuraNavigationUser', JSON.stringify({ key: users.docs[0].id, ...users.docs[0].data() }) );
    this.props.navigation.navigate('AuthLoading');
  }
  render() {
    return (
      <View style={styles.container}>
        <TextInput
          style={{height: 40, borderColor: 'gray', borderWidth: 1}}
          onChangeText={(text) => this.onInputChange({userid:text})}
          value={this.state.userid}
          placeholder="User ID"
        />
        <Text>{this.state.useridError}</Text>
        <TextInput
          style={{height: 40, borderColor: 'gray', borderWidth: 1}}
          onChangeText={(text) => this.onInputChange({password:text})}
          value={this.state.password}
          placeholder="Password"
        />
        <Text>{this.state.passwordError}</Text>
        <Button title="Sign in!" onPress={this.onSubmit} />
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
  userIdTextInput:{

  },
  passwordTextInput:{

  },
  
});